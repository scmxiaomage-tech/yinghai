package refund

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"yinghai/go-api-server/internal/config"
	inventorymodule "yinghai/go-api-server/internal/modules/inventory"
	ordermodule "yinghai/go-api-server/internal/modules/order"
	paymentmodule "yinghai/go-api-server/internal/modules/payment"

	"gorm.io/datatypes"
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

func (s *Service) CreateAdminRefund(ctx context.Context, orderID uint64, operatorID string, input CreateRefundInput) (*RefundDTO, error) {
	providerName := input.Provider
	if providerName == "" {
		providerName = ProviderWechatPay
	}
	provider, err := s.providers.Get(providerName)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	refundModel := &Refund{}
	providerTradeNo := ""
	err = s.repo.Transaction(func(tx *gorm.DB) error {
		order, err := s.repo.LockOrder(tx, orderID)
		if err != nil {
			return ErrRefundNotFound
		}
		if order.Status == ordermodule.StatusRefunded || order.Status == ordermodule.StatusRefunding {
			return ErrRefundAlreadyExists
		}
		if order.Status != ordermodule.StatusPaid {
			return ErrRefundNotAllowed
		}
		payment, err := s.repo.LatestSuccessfulPayment(tx, order.ID)
		if err != nil {
			return ErrRefundNotAllowed
		}
		if payment.Status != paymentmodule.StatusSuccess || payment.Amount != order.PayableAmount || payment.Currency != CurrencyCNY {
			return ErrRefundAmountMismatch
		}
		providerTradeNo = strValue(payment.ProviderTradeNo)
		if _, err := s.repo.FindByOrder(order.ID); err == nil {
			return ErrRefundAlreadyExists
		}
		reason := input.Reason
		refundModel = &Refund{RefundNo: generateRefundNo(), OrderID: order.ID, OrderNo: order.OrderNo, PaymentID: payment.ID, PaymentNo: payment.PaymentNo, UserID: order.UserID, Provider: providerName, Amount: order.PayableAmount, Currency: payment.Currency, Status: StatusPending, Reason: strPtr(reason), Source: SourceAdmin, RequestedBy: operatorID, RequestedAt: now}
		if err := s.repo.Create(tx, refundModel); err != nil {
			return ErrRefundAlreadyExists
		}
		if _, err := s.repo.UpdateOrderStatus(tx, order.ID, ordermodule.StatusPaid, ordermodule.StatusRefunding, map[string]any{}); err != nil {
			return err
		}
		return s.createEvent(tx, refundModel, EventRefundCreated, "", StatusPending, true, nil, nil)
	})
	if err != nil {
		return nil, err
	}
	resp, err := provider.CreateRefund(ctx, RefundProviderRequest{RefundNo: refundModel.RefundNo, OrderNo: refundModel.OrderNo, PaymentNo: refundModel.PaymentNo, ProviderTradeNo: providerTradeNo, Amount: refundModel.Amount, Currency: refundModel.Currency, Reason: strValue(refundModel.Reason), NotifyURL: s.cfg.WechatRefundNotifyURL})
	if err != nil {
		_ = s.repo.Transaction(func(tx *gorm.DB) error {
			model, lockErr := s.repo.LockRefundByNo(tx, refundModel.RefundNo)
			if lockErr != nil {
				return lockErr
			}
			old := model.Status
			model.Status = StatusFailed
			failedAt := time.Now()
			model.FailedAt = &failedAt
			if updateErr := s.repo.Update(tx, model); updateErr != nil {
				return updateErr
			}
			_, _ = s.repo.UpdateOrderStatus(tx, model.OrderID, ordermodule.StatusRefunding, ordermodule.StatusPaid, map[string]any{})
			msg := err.Error()
			return s.createEvent(tx, model, EventRefundFailed, old, StatusFailed, true, nil, &msg)
		})
		return nil, err
	}
	if err := s.repo.Transaction(func(tx *gorm.DB) error {
		model, err := s.repo.LockRefundByNo(tx, refundModel.RefundNo)
		if err != nil {
			return err
		}
		old := model.Status
		model.Status = StatusProcessing
		if resp.Status == StatusSuccess {
			model.Status = StatusSuccess
		}
		if resp.ProviderRefundID != "" {
			model.ProviderRefundID = &resp.ProviderRefundID
		}
		if len(resp.Raw) > 0 {
			model.ProviderResponse = datatypes.JSON(resp.Raw)
		}
		if err := s.repo.Update(tx, model); err != nil {
			return err
		}
		if err := s.createEvent(tx, model, EventRefundSubmitted, old, model.Status, true, nil, nil); err != nil {
			return err
		}
		if model.Status == StatusSuccess {
			return s.handleRefundSuccessInTx(tx, model, RefundNotification{Status: StatusSuccess, Amount: model.Amount, Currency: model.Currency, SuccessAt: now})
		}
		refundModel = model
		return nil
	}); err != nil {
		return nil, err
	}
	return s.toDTO(refundModel), nil
}

func (s *Service) GetUserRefund(userID string, id uint64) (*RefundDTO, error) {
	model, err := s.repo.FindByID(id)
	if err != nil || model.UserID != userID {
		return nil, ErrRefundNotFound
	}
	return s.toDTO(model), nil
}

func (s *Service) GetUserOrderRefund(userID string, orderID uint64) (*RefundDTO, error) {
	model, err := s.repo.FindByOrder(orderID)
	if err != nil || model.UserID != userID {
		return nil, ErrRefundNotFound
	}
	return s.toDTO(model), nil
}

func (s *Service) HandleProviderNotification(ctx context.Context, providerName string, headers map[string]string, body []byte) error {
	provider, err := s.providers.Get(providerName)
	if err != nil {
		return err
	}
	notification, err := provider.VerifyRefundNotification(ctx, headers, body)
	if err != nil {
		return err
	}
	return s.recordAndHandleNotification(notification)
}

func (s *Service) recordAndHandleNotification(notification RefundNotification) error {
	if notification.MerchantRefundNo == "" {
		return ErrRefundNotificationInvalid
	}
	return s.repo.Transaction(func(tx *gorm.DB) error {
		model, err := s.repo.LockRefundByNo(tx, notification.MerchantRefundNo)
		if err != nil {
			return ErrRefundNotFound
		}
		if err := s.createNotificationEvent(tx, model, notification); err != nil {
			return err
		}
		if notification.Status == StatusSuccess {
			return s.handleRefundSuccessInTx(tx, model, notification)
		}
		if notification.Status == StatusFailed {
			old := model.Status
			model.Status = StatusFailed
			failedAt := time.Now()
			model.FailedAt = &failedAt
			if notification.ProviderRefundID != "" {
				model.ProviderRefundID = &notification.ProviderRefundID
			}
			if err := s.repo.Update(tx, model); err != nil {
				return err
			}
			_, _ = s.repo.UpdateOrderStatus(tx, model.OrderID, ordermodule.StatusRefunding, ordermodule.StatusPaid, map[string]any{})
			return s.createEvent(tx, model, EventRefundFailed, old, StatusFailed, true, notification.RawPayload, nil)
		}
		return s.createEvent(tx, model, EventRefundProcessing, model.Status, StatusProcessing, true, notification.RawPayload, nil)
	})
}

func (s *Service) handleRefundSuccessInTx(tx *gorm.DB, model *Refund, notification RefundNotification) error {
	if model.Status == StatusSuccess {
		return s.createEvent(tx, model, EventRefundNotificationDuplicated, StatusSuccess, StatusSuccess, true, notification.RawPayload, nil)
	}
	order, err := s.repo.LockOrder(tx, model.OrderID)
	if err != nil {
		return err
	}
	payment, err := s.repo.LockPayment(tx, model.PaymentID)
	if err != nil {
		return err
	}
	if payment.Status != paymentmodule.StatusSuccess || order.Status != ordermodule.StatusRefunding {
		return ErrRefundInvalidState
	}
	if notification.Amount != model.Amount {
		msg := "channel refund amount and refund amount must match"
		_ = s.createEvent(tx, model, EventRefundAmountMismatch, model.Status, model.Status, true, notification.RawPayload, &msg)
		return ErrRefundAmountMismatch
	}
	if model.Amount != payment.Amount || model.Amount != order.PayableAmount {
		msg := "refund amount, payment amount and order payable amount must match"
		_ = s.createEvent(tx, model, EventRefundAmountMismatch, model.Status, model.Status, true, notification.RawPayload, &msg)
		return ErrRefundAmountMismatch
	}
	old := model.Status
	successAt := notification.SuccessAt
	if successAt.IsZero() {
		successAt = time.Now()
	}
	model.Status = StatusSuccess
	model.SuccessAt = &successAt
	if notification.ProviderRefundID != "" {
		model.ProviderRefundID = &notification.ProviderRefundID
	}
	if err := s.repo.Update(tx, model); err != nil {
		return err
	}
	if _, err := s.repo.UpdateOrderStatus(tx, order.ID, ordermodule.StatusRefunding, ordermodule.StatusRefunded, map[string]any{}); err != nil {
		return err
	}
	for _, item := range order.Items {
		if err := s.inventory.RefundReturnInventoryWithTx(tx, inventorymodule.OperationInput{SKUID: item.SKUID, Quantity: item.Quantity, ReferenceType: ordermodule.InventoryReferenceTypeRefund, ReferenceID: model.RefundNo, OperatorType: "refund_success", OperatorID: &model.UserID}); err != nil && err != inventorymodule.ErrDuplicateOperation {
			return err
		}
	}
	if err := s.createEvent(tx, model, EventRefundStockReturned, StatusSuccess, StatusSuccess, true, notification.RawPayload, nil); err != nil {
		return err
	}
	return s.createEvent(tx, model, EventRefundSuccess, old, StatusSuccess, true, notification.RawPayload, nil)
}

func (s *Service) ListAdminRefunds(query RefundQuery) (PageResult[RefundDTO], error) {
	result, err := s.repo.ListRefunds(query)
	if err != nil {
		return PageResult[RefundDTO]{}, err
	}
	items := make([]RefundDTO, 0, len(result.Items))
	for i := range result.Items {
		items = append(items, *s.toDTO(&result.Items[i]))
	}
	return PageResult[RefundDTO]{Page: result.Page, PageSize: result.PageSize, Total: result.Total, Items: items}, nil
}

func (s *Service) GetAdminRefund(id uint64) (*AdminRefundDTO, error) {
	model, err := s.repo.FindByID(id)
	if err != nil {
		return nil, ErrRefundNotFound
	}
	events, _ := s.repo.ListEvents(model.ID)
	return &AdminRefundDTO{RefundDTO: *s.toDTO(model), Events: events}, nil
}

func (s *Service) createNotificationEvent(tx *gorm.DB, model *Refund, notification RefundNotification) error {
	event := &RefundEvent{RefundID: &model.ID, RefundNo: model.RefundNo, EventType: EventRefundNotificationReceived, Provider: strPtr(model.Provider), ProviderRefundID: strPtr(notification.ProviderRefundID), PayloadHash: notification.PayloadHash, Payload: datatypes.JSON(notification.RawPayload), Processed: true}
	if event.PayloadHash == "" {
		event.PayloadHash = hashPayload([]byte(model.RefundNo))
	}
	if notification.EventID != "" {
		event.ProviderEventID = &notification.EventID
	}
	if err := s.repo.CreateEvent(tx, event); err != nil {
		return nil
	}
	return nil
}

func (s *Service) createEvent(tx *gorm.DB, model *Refund, eventType string, oldStatus string, newStatus string, processed bool, payload []byte, message *string) error {
	event := &RefundEvent{RefundID: &model.ID, RefundNo: model.RefundNo, EventType: eventType, OldStatus: strPtr(oldStatus), NewStatus: strPtr(newStatus), Provider: strPtr(model.Provider), ProviderRefundID: model.ProviderRefundID, PayloadHash: hashPayload([]byte(model.RefundNo + eventType)), Processed: processed, ErrorMessage: message}
	if len(payload) > 0 {
		event.Payload = datatypes.JSON(payload)
		event.PayloadHash = hashPayload(payload)
	}
	if processed {
		now := time.Now()
		event.ProcessedAt = &now
		result := eventType
		event.ProcessResult = &result
	}
	return s.repo.CreateEvent(tx, event)
}

func (s *Service) toDTO(model *Refund) *RefundDTO {
	return &RefundDTO{ID: model.ID, RefundNo: model.RefundNo, OrderID: model.OrderID, OrderNo: model.OrderNo, PaymentID: model.PaymentID, PaymentNo: model.PaymentNo, UserID: model.UserID, Provider: model.Provider, ProviderRefundID: model.ProviderRefundID, Amount: model.Amount, AmountText: centsText(model.Amount), Currency: model.Currency, Status: model.Status, Reason: model.Reason, Source: model.Source, RequestedBy: model.RequestedBy, RequestedAt: model.RequestedAt, SuccessAt: model.SuccessAt, FailedAt: model.FailedAt, ClosedAt: model.ClosedAt, CreatedAt: model.CreatedAt}
}

func generateRefundNo() string {
	var b [3]byte
	_, _ = rand.Read(b[:])
	return fmt.Sprintf("REF%d%06d", time.Now().UnixMilli(), int(b[0])<<16|int(b[1])<<8|int(b[2]))
}

func hashPayload(body []byte) string {
	sum := sha256.Sum256(body)
	return hex.EncodeToString(sum[:])
}

func centsText(value uint64) string { return fmt.Sprintf("%.2f", float64(value)/100) }

func strPtr(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func strValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func rawJSON(v any) datatypes.JSON {
	raw, _ := json.Marshal(v)
	return datatypes.JSON(raw)
}
