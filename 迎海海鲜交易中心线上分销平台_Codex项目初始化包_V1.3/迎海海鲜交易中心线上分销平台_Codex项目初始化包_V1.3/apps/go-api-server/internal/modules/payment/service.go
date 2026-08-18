package payment

import (
	"context"
	"crypto/rand"
	"fmt"
	"time"

	"yinghai/go-api-server/internal/config"
	inventorymodule "yinghai/go-api-server/internal/modules/inventory"
	ordermodule "yinghai/go-api-server/internal/modules/order"

	"gorm.io/gorm"
)

type Service struct {
	repo      *Repository
	inventory *inventorymodule.Service
	providers *ProviderRegistry
	cfg       config.Config
}

func NewService(repo *Repository, inventory *inventorymodule.Service, providers *ProviderRegistry, cfg config.Config) *Service {
	return &Service{repo: repo, inventory: inventory, providers: providers, cfg: cfg}
}

func (s *Service) CreatePayment(ctx context.Context, userID string, orderID uint64, input CreatePaymentInput) (*PaymentDTO, error) {
	providerName := input.Provider
	if providerName == "" {
		providerName = ProviderWechatPay
	}
	provider, err := s.providers.Get(providerName)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	order, err := s.repo.FindUserOrder(userID, orderID)
	if err != nil {
		return nil, ErrPaymentNotFound
	}
	if order.UserID != userID {
		return nil, ErrPaymentNotFound
	}
	if order.Status != ordermodule.StatusPendingPayment {
		return nil, ErrPaymentOrderInvalidStatus
	}
	if !order.ExpireAt.After(now) {
		return nil, ErrPaymentOrderExpired
	}
	if order.PayableAmount == 0 {
		return nil, ErrPaymentCreateFailed
	}
	if existing, err := s.repo.FindReusablePending(order.ID, providerName, now); err == nil {
		return s.toDTO(existing, reusableClientParams(existing)), nil
	}
	payment := &Payment{PaymentNo: generatePaymentNo(), OrderID: order.ID, OrderNo: order.OrderNo, UserID: userID, Provider: providerName, Channel: ChannelMiniapp, Status: StatusCreated, Amount: order.PayableAmount, Currency: CurrencyCNY, ExpireAt: order.ExpireAt}
	if input.ClientRequestID != "" {
		payment.ClientRequestID = &input.ClientRequestID
	}
	if err := s.repo.Transaction(func(tx *gorm.DB) error { return s.repo.Create(tx, payment) }); err != nil {
		return nil, ErrPaymentDuplicateRequest
	}
	resp, err := provider.CreatePayment(ctx, ProviderPaymentRequest{PaymentNo: payment.PaymentNo, OrderNo: order.OrderNo, Description: "迎海订单 " + order.OrderNo, Amount: payment.Amount, Currency: payment.Currency, ExpireAt: payment.ExpireAt, NotifyURL: s.cfg.WechatPayNotifyURL})
	if err != nil {
		_ = s.repo.Transaction(func(tx *gorm.DB) error {
			failedAt := time.Now()
			payment.Status = StatusFailed
			payment.FailedAt = &failedAt
			return s.repo.Update(tx, payment)
		})
		return nil, err
	}
	payment.Status = StatusPending
	if resp.ProviderPrepayID != "" {
		payment.ProviderPrepayID = &resp.ProviderPrepayID
	}
	if err := s.repo.Transaction(func(tx *gorm.DB) error {
		if err := s.repo.Update(tx, payment); err != nil {
			return err
		}
		return s.repo.CreateEvent(tx, &PaymentEvent{PaymentID: &payment.ID, PaymentNo: payment.PaymentNo, Provider: payment.Provider, EventType: EventCreate, PayloadHash: hashPayload([]byte(payment.PaymentNo)), Processed: true})
	}); err != nil {
		return nil, ErrPaymentCreateFailed
	}
	return s.toDTO(payment, resp.ClientParams), nil
}

func (s *Service) GetPaymentStatus(ctx context.Context, userID string, orderID uint64) (*PaymentStatusDTO, error) {
	order, err := s.repo.FindUserOrder(userID, orderID)
	if err != nil {
		return nil, ErrPaymentNotFound
	}
	dto := &PaymentStatusDTO{OrderID: order.ID, OrderNo: order.OrderNo, OrderStatus: order.Status}
	payment, err := s.repo.FindLatestByOrder(order.ID)
	if err == nil {
		if payment.Status == StatusPending {
			_, _ = s.QueryAndSync(ctx, payment.ID)
			payment, _ = s.repo.FindByID(payment.ID)
		}
		dto.Payment = s.toDTO(payment, nil)
	}
	return dto, nil
}

func (s *Service) HandleProviderNotification(ctx context.Context, providerName string, headers map[string]string, body []byte) error {
	provider, err := s.providers.Get(providerName)
	if err != nil {
		return err
	}
	notification, err := provider.VerifyAndParseNotification(ctx, headers, body)
	if err != nil {
		return err
	}
	return s.recordAndHandleNotification(ctx, notification)
}

func (s *Service) QueryAndSync(ctx context.Context, paymentID uint64) (*PaymentDTO, error) {
	model, err := s.repo.FindByID(paymentID)
	if err != nil {
		return nil, ErrPaymentNotFound
	}
	provider, err := s.providers.Get(model.Provider)
	if err != nil {
		return nil, err
	}
	notification, err := provider.QueryPayment(ctx, model)
	if err != nil {
		return nil, ErrPaymentQueryFailed
	}
	if notification.Status == StatusSuccess {
		if err := s.recordAndHandleNotification(ctx, notification); err != nil {
			return nil, err
		}
		model, _ = s.repo.FindByID(paymentID)
	}
	return s.toDTO(model, nil), nil
}

func (s *Service) ClosePayment(ctx context.Context, paymentID uint64) error {
	model, err := s.repo.FindByID(paymentID)
	if err != nil {
		return ErrPaymentNotFound
	}
	if model.Status == StatusSuccess {
		return ErrPaymentAlreadySuccess
	}
	if model.Status == StatusClosed {
		return ErrPaymentAlreadyClosed
	}
	provider, err := s.providers.Get(model.Provider)
	if err != nil {
		return err
	}
	if err := provider.ClosePayment(ctx, model); err != nil {
		return ErrPaymentCloseFailed
	}
	now := time.Now()
	model.Status = StatusClosed
	model.ClosedAt = &now
	return s.repo.Transaction(func(tx *gorm.DB) error {
		if err := s.repo.Update(tx, model); err != nil {
			return err
		}
		return s.repo.CreateEvent(tx, &PaymentEvent{PaymentID: &model.ID, PaymentNo: model.PaymentNo, Provider: model.Provider, EventType: EventClose, PayloadHash: hashPayload([]byte(model.PaymentNo)), Processed: true})
	})
}

func (s *Service) RecoverPendingPayments(ctx context.Context, limit int) (int, error) {
	result, err := s.repo.ListPayments(PaymentQuery{Status: StatusPending, Page: 1, PageSize: limit})
	if err != nil {
		return 0, err
	}
	handled := 0
	for i := range result.Items {
		if _, err := s.QueryAndSync(ctx, result.Items[i].ID); err == nil {
			handled++
		}
	}
	return handled, nil
}

func (s *Service) recordAndHandleNotification(ctx context.Context, notification PaymentNotification) error {
	if notification.MerchantPaymentNo == "" {
		return ErrPaymentNotificationInvalid
	}
	return s.repo.Transaction(func(tx *gorm.DB) error {
		payment, err := s.repo.LockPaymentByNo(tx, notification.MerchantPaymentNo)
		if err != nil {
			return ErrPaymentNotFound
		}
		event := &PaymentEvent{PaymentID: &payment.ID, PaymentNo: payment.PaymentNo, Provider: payment.Provider, EventType: EventNotify, ProviderTradeNo: strPtr(notification.ProviderTradeNo), PayloadHash: notification.PayloadHash, Processed: false}
		if notification.EventID != "" {
			event.ProviderEventID = &notification.EventID
		}
		if event.PayloadHash == "" {
			event.PayloadHash = hashPayload([]byte(notification.MerchantPaymentNo))
		}
		_ = s.repo.CreateEvent(tx, event)
		if notification.Status != StatusSuccess {
			result := "IGNORED_NON_SUCCESS"
			return s.repo.MarkEventProcessed(tx, event.ID, result, nil)
		}
		if payment.Status == StatusSuccess {
			result := "DUPLICATE_SUCCESS"
			return s.repo.MarkEventProcessed(tx, event.ID, result, nil)
		}
		order, err := s.repo.LockOrder(tx, payment.OrderID)
		if err != nil {
			return err
		}
		if payment.Amount != notification.Amount || payment.Amount != order.PayableAmount || notification.Currency != payment.Currency {
			msg := "provider amount, payment amount and order payable amount must match"
			_ = s.repo.CreateEvent(tx, &PaymentEvent{PaymentID: &payment.ID, PaymentNo: payment.PaymentNo, Provider: payment.Provider, EventType: EventAmountMismatch, ProviderTradeNo: strPtr(notification.ProviderTradeNo), PayloadHash: event.PayloadHash, Processed: true, ProcessResult: strPtr(EventAmountMismatch), ErrorMessage: &msg})
			return ErrPaymentAmountMismatch
		}
		if order.Status != ordermodule.StatusPendingPayment {
			return ErrPaymentOrderInvalidStatus
		}
		paidAt := notification.PaidAt
		if paidAt.IsZero() {
			paidAt = time.Now()
		}
		payment.Status = StatusSuccess
		payment.PaidAt = &paidAt
		if notification.ProviderTradeNo != "" {
			payment.ProviderTradeNo = &notification.ProviderTradeNo
		}
		if err := s.repo.Update(tx, payment); err != nil {
			return err
		}
		rows, err := s.repo.UpdateOrderPaid(tx, order.ID, paidAt)
		if err != nil {
			return err
		}
		if rows == 0 {
			return ErrPaymentOrderInvalidStatus
		}
		for _, item := range order.Items {
			if err := s.inventory.DeductInventoryWithTx(tx, inventorymodule.OperationInput{SKUID: item.SKUID, Quantity: item.Quantity, ReferenceType: ordermodule.InventoryReferenceTypeOrder, ReferenceID: order.OrderNo, OperatorType: "payment_success", OperatorID: &payment.UserID}); err != nil && err != inventorymodule.ErrDuplicateOperation {
				return err
			}
		}
		result := "SUCCESS"
		return s.repo.MarkEventProcessed(tx, event.ID, result, nil)
	})
}

func (s *Service) ListAdminPayments(query PaymentQuery) (PageResult[AdminPaymentDTO], error) {
	result, err := s.repo.ListPayments(query)
	if err != nil {
		return PageResult[AdminPaymentDTO]{}, err
	}
	items := make([]AdminPaymentDTO, 0, len(result.Items))
	for i := range result.Items {
		dto := AdminPaymentDTO{PaymentDTO: *s.toDTO(&result.Items[i], nil), UserID: result.Items[i].UserID}
		items = append(items, dto)
	}
	return PageResult[AdminPaymentDTO]{Page: result.Page, PageSize: result.PageSize, Total: result.Total, Items: items}, nil
}

func (s *Service) GetAdminPayment(id uint64) (*AdminPaymentDTO, error) {
	model, err := s.repo.FindByID(id)
	if err != nil {
		return nil, ErrPaymentNotFound
	}
	events, _ := s.repo.ListEvents(model.ID)
	return &AdminPaymentDTO{PaymentDTO: *s.toDTO(model, nil), UserID: model.UserID, Events: events}, nil
}

func (s *Service) toDTO(model *Payment, clientParams map[string]string) *PaymentDTO {
	return &PaymentDTO{ID: model.ID, PaymentNo: model.PaymentNo, OrderID: model.OrderID, OrderNo: model.OrderNo, Provider: model.Provider, Channel: model.Channel, Status: model.Status, Amount: model.Amount, AmountText: centsText(model.Amount), Currency: model.Currency, ProviderTradeNo: model.ProviderTradeNo, ProviderPrepayID: model.ProviderPrepayID, ClientParams: clientParams, ExpireAt: model.ExpireAt, PaidAt: model.PaidAt, CreatedAt: model.CreatedAt}
}

func reusableClientParams(model *Payment) map[string]string {
	params := map[string]string{"provider": model.Provider, "paymentNo": model.PaymentNo}
	if model.ProviderPrepayID != nil {
		params["prepayId"] = *model.ProviderPrepayID
	}
	if model.Provider == ProviderMock {
		params["mockOnly"] = "true"
	}
	return params
}

func generatePaymentNo() string {
	var b [3]byte
	_, _ = rand.Read(b[:])
	return fmt.Sprintf("PAY%d%06d", time.Now().UnixMilli(), int(b[0])<<16|int(b[1])<<8|int(b[2]))
}

func centsText(value uint64) string { return fmt.Sprintf("%.2f", float64(value)/100) }
func strPtr(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
