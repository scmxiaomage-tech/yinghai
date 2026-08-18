package order

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"yinghai/go-api-server/internal/config"
	inventorymodule "yinghai/go-api-server/internal/modules/inventory"
	productmodule "yinghai/go-api-server/internal/modules/product"

	"gorm.io/gorm"
)

var (
	ErrOrderNotFound          = errors.New("ORDER_NOT_FOUND")
	ErrOrderCreateFailed      = errors.New("ORDER_CREATE_FAILED")
	ErrOrderInvalidStatus     = errors.New("ORDER_INVALID_STATUS")
	ErrOrderAlreadyCancelled  = errors.New("ORDER_ALREADY_CANCELLED")
	ErrOrderAlreadyClosed     = errors.New("ORDER_ALREADY_CLOSED")
	ErrOrderExpired           = errors.New("ORDER_EXPIRED")
	ErrOrderItemInvalid       = errors.New("ORDER_ITEM_INVALID")
	ErrOrderPriceChanged      = errors.New("ORDER_PRICE_CHANGED")
	ErrOrderDuplicateRequest  = errors.New("ORDER_DUPLICATE_REQUEST")
	ErrOrderInsufficientStock = errors.New("ORDER_INSUFFICIENT_STOCK")
)

type Service struct {
	repo      *Repository
	inventory *inventorymodule.Service
	cfg       config.Config
}

func NewService(repo *Repository, inventory *inventorymodule.Service, cfg config.Config) *Service {
	return &Service{repo: repo, inventory: inventory, cfg: cfg}
}

func (s *Service) Preview(input PreviewOrderInput) (*PreviewDTO, error) {
	items, err := s.buildPreviewItems(input.Items)
	if err != nil {
		return nil, err
	}
	var itemAmount uint64
	for _, item := range items {
		if item.Available {
			itemAmount += item.Subtotal
		}
	}
	dto := &PreviewDTO{Items: items, ItemAmount: itemAmount, DiscountAmount: 0, ShippingAmount: 0, PayableAmount: itemAmount}
	dto.ItemAmountText = centsText(dto.ItemAmount)
	dto.PayableAmountText = centsText(dto.PayableAmount)
	dto.PriceSnapshot = priceSnapshot(items)
	return dto, nil
}

func (s *Service) Create(userID string, input CreateOrderInput) (*OrderDTO, error) {
	if input.RequestID == "" || input.ReceiverName == "" || input.ReceiverPhone == "" || input.ReceiverAddress == "" {
		return nil, ErrOrderItemInvalid
	}
	if existing, err := s.repo.FindByUserRequest(userID, input.RequestID); err == nil {
		return s.toDTO(existing), nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	preview, err := s.Preview(PreviewOrderInput{Items: input.Items})
	if err != nil {
		return nil, err
	}
	if input.PriceSnapshot == "" || input.PriceSnapshot != preview.PriceSnapshot {
		return nil, ErrOrderPriceChanged
	}
	for _, item := range preview.Items {
		if !item.Available {
			return nil, ErrOrderInsufficientStock
		}
	}
	orderNo := generateOrderNo()
	expireAt := time.Now().Add(time.Duration(s.cfg.OrderExpireMinutes) * time.Minute)
	model := &Order{OrderNo: orderNo, UserID: userID, RequestID: input.RequestID, Status: StatusPendingPayment, ItemAmount: preview.ItemAmount, DiscountAmount: 0, ShippingAmount: 0, PayableAmount: preview.PayableAmount, ReceiverName: input.ReceiverName, ReceiverPhone: input.ReceiverPhone, ReceiverAddress: input.ReceiverAddress, BuyerRemark: input.BuyerRemark, ExpireAt: expireAt}
	var orderItems []OrderItem
	for _, item := range preview.Items {
		orderItems = append(orderItems, OrderItem{ProductID: item.ProductID, SKUID: item.SKUID, ProductName: item.ProductName, SKUName: item.SKUName, ProductImage: item.ProductImage, UnitPrice: item.UnitPrice, Quantity: item.Quantity, Subtotal: item.Subtotal})
	}
	sort.Slice(orderItems, func(i, j int) bool { return orderItems[i].SKUID < orderItems[j].SKUID })
	if err := s.repo.Transaction(func(tx *gorm.DB) error {
		if err := s.repo.CreateOrder(tx, model); err != nil {
			return err
		}
		for i := range orderItems {
			orderItems[i].OrderID = model.ID
		}
		if err := s.repo.CreateItems(tx, orderItems); err != nil {
			return err
		}
		refID := model.OrderNo
		for _, item := range orderItems {
			err := s.inventory.LockInventoryWithTx(tx, inventorymodule.OperationInput{SKUID: item.SKUID, Quantity: item.Quantity, ReferenceType: InventoryReferenceTypeOrder, ReferenceID: refID, OperatorType: "order", OperatorID: &userID})
			if err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		if errors.Is(err, inventorymodule.ErrInsufficientStock) {
			return nil, ErrOrderInsufficientStock
		}
		return nil, ErrOrderCreateFailed
	}
	_ = s.repo.RemoveCartItemsBySKU(userID, skuIDsFromItems(orderItems))
	model.Items = orderItems
	return s.toDTO(model), nil
}

func (s *Service) Cancel(userID string, id uint64, reason string) (*OrderDTO, error) {
	if reason == "" {
		reason = "用户取消订单"
	}
	order, err := s.repo.FindUserOrder(userID, id)
	if err != nil {
		return nil, ErrOrderNotFound
	}
	if order.Status == StatusCancelled {
		return nil, ErrOrderAlreadyCancelled
	}
	if order.Status == StatusClosed {
		return nil, ErrOrderAlreadyClosed
	}
	if order.Status != StatusPendingPayment {
		return nil, ErrOrderInvalidStatus
	}
	now := time.Now()
	if err := s.repo.Transaction(func(tx *gorm.DB) error {
		rows, err := s.repo.UpdateStatusIfPending(tx, id, userID, StatusCancelled, map[string]any{"cancel_reason": reason, "cancelled_at": now})
		if err != nil {
			return err
		}
		if rows == 0 {
			return ErrOrderInvalidStatus
		}
		for _, item := range order.Items {
			err := s.inventory.UnlockInventoryWithTx(tx, inventorymodule.OperationInput{SKUID: item.SKUID, Quantity: item.Quantity, ReferenceType: InventoryReferenceTypeOrder, ReferenceID: order.OrderNo, OperatorType: "order_cancel", OperatorID: &userID})
			if err != nil && !errors.Is(err, inventorymodule.ErrDuplicateOperation) {
				return err
			}
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return s.GetUserOrder(userID, id)
}

func (s *Service) CloseExpiredOrders(limit int) (int, error) {
	orders, err := s.repo.ExpiredPendingOrders(limit)
	if err != nil {
		return 0, err
	}
	closed := 0
	for _, order := range orders {
		o := order
		err := s.repo.Transaction(func(tx *gorm.DB) error {
			now := time.Now()
			rows, err := s.repo.UpdateStatusIfPending(tx, o.ID, "", StatusClosed, map[string]any{"closed_at": now, "cancel_reason": "订单超时关闭"})
			if err != nil || rows == 0 {
				return err
			}
			for _, item := range o.Items {
				err := s.inventory.UnlockInventoryWithTx(tx, inventorymodule.OperationInput{SKUID: item.SKUID, Quantity: item.Quantity, ReferenceType: InventoryReferenceTypeOrder, ReferenceID: o.OrderNo, OperatorType: "order_timeout"})
				if err != nil && !errors.Is(err, inventorymodule.ErrDuplicateOperation) {
					return err
				}
			}
			return nil
		})
		if err != nil {
			return closed, err
		}
		closed++
	}
	return closed, nil
}

func (s *Service) ListUserOrders(userID string, query OrderQuery) (PageResult[OrderDTO], error) {
	query.UserID = userID
	return s.listOrders(query)
}

func (s *Service) ListAdminOrders(query OrderQuery) (PageResult[OrderDTO], error) {
	return s.listOrders(query)
}

func (s *Service) GetUserOrder(userID string, id uint64) (*OrderDTO, error) {
	model, err := s.repo.FindUserOrder(userID, id)
	if err != nil {
		return nil, ErrOrderNotFound
	}
	return s.toDTO(model), nil
}

func (s *Service) GetAdminOrder(id uint64) (*OrderDTO, error) {
	model, err := s.repo.FindOrder(id)
	if err != nil {
		return nil, ErrOrderNotFound
	}
	return s.toDTO(model), nil
}

func (s *Service) listOrders(query OrderQuery) (PageResult[OrderDTO], error) {
	result, err := s.repo.ListOrders(query)
	if err != nil {
		return PageResult[OrderDTO]{}, err
	}
	items := make([]OrderDTO, 0, len(result.Items))
	for i := range result.Items {
		items = append(items, *s.toDTO(&result.Items[i]))
	}
	return PageResult[OrderDTO]{Page: result.Page, PageSize: result.PageSize, Total: result.Total, Items: items}, nil
}

func (s *Service) buildPreviewItems(input []OrderItemInput) ([]PreviewItemDTO, error) {
	if len(input) == 0 {
		return nil, ErrOrderItemInvalid
	}
	merged := map[uint64]uint64{}
	for _, item := range input {
		if item.SKUID == 0 || item.Quantity == 0 || item.Quantity > 999 {
			return nil, ErrOrderItemInvalid
		}
		merged[item.SKUID] += item.Quantity
	}
	skuIDs := make([]uint64, 0, len(merged))
	for skuID := range merged {
		skuIDs = append(skuIDs, skuID)
	}
	sort.Slice(skuIDs, func(i, j int) bool { return skuIDs[i] < skuIDs[j] })
	snapshots, err := s.repo.ProductSnapshots(skuIDs)
	if err != nil {
		return nil, err
	}
	items := make([]PreviewItemDTO, 0, len(skuIDs))
	for _, skuID := range skuIDs {
		snap, ok := snapshots[skuID]
		if !ok {
			return nil, ErrOrderItemInvalid
		}
		quantity := merged[skuID]
		unitPrice := yuanToCents(snap.SalePrice)
		reason := unavailableReason(snap, quantity)
		available := reason == nil
		subtotal := unitPrice * quantity
		items = append(items, PreviewItemDTO{ProductID: snap.ProductID, SKUID: snap.SKUID, ProductName: snap.ProductName, SKUName: snap.SKUName, ProductImage: snap.ProductImage, UnitPrice: unitPrice, UnitPriceText: centsText(unitPrice), Quantity: quantity, Subtotal: subtotal, SubtotalText: centsText(subtotal), AvailableStock: snap.AvailableStock, Available: available, UnavailableReason: reason})
	}
	return items, nil
}

func unavailableReason(snap ProductSnapshot, quantity uint64) *string {
	var reason string
	if snap.ShelfStatus != productmodule.ProductShelfOnSale {
		reason = "PRODUCT_OFF_SHELF"
	}
	if snap.SKUStatus != productmodule.SKUStatusEnabled {
		reason = "SKU_DISABLED"
	}
	if snap.AvailableStock == 0 {
		reason = "OUT_OF_STOCK"
	}
	if snap.AvailableStock > 0 && snap.AvailableStock < quantity {
		reason = "INSUFFICIENT_STOCK"
	}
	if reason == "" {
		return nil
	}
	return &reason
}

func (s *Service) toDTO(model *Order) *OrderDTO {
	dto := &OrderDTO{ID: model.ID, OrderNo: model.OrderNo, Status: model.Status, ItemAmount: model.ItemAmount, DiscountAmount: model.DiscountAmount, ShippingAmount: model.ShippingAmount, PayableAmount: model.PayableAmount, ItemAmountText: centsText(model.ItemAmount), PayableAmountText: centsText(model.PayableAmount), ReceiverName: model.ReceiverName, ReceiverPhone: model.ReceiverPhone, ReceiverAddress: model.ReceiverAddress, BuyerRemark: model.BuyerRemark, CancelReason: model.CancelReason, ExpireAt: model.ExpireAt, CreatedAt: model.CreatedAt, CancelledAt: model.CancelledAt, ClosedAt: model.ClosedAt}
	for _, item := range model.Items {
		dto.Items = append(dto.Items, OrderItemDTO{ID: item.ID, ProductID: item.ProductID, SKUID: item.SKUID, ProductName: item.ProductName, SKUName: item.SKUName, ProductImage: item.ProductImage, UnitPrice: item.UnitPrice, UnitPriceText: centsText(item.UnitPrice), Quantity: item.Quantity, Subtotal: item.Subtotal, SubtotalText: centsText(item.Subtotal)})
	}
	return dto
}

func priceSnapshot(items []PreviewItemDTO) string {
	parts := make([]string, 0, len(items))
	for _, item := range items {
		parts = append(parts, fmt.Sprintf("%d:%d:%d", item.SKUID, item.Quantity, item.UnitPrice))
	}
	sort.Strings(parts)
	sum := sha256.Sum256([]byte(strings.Join(parts, "|")))
	return hex.EncodeToString(sum[:])
}

func generateOrderNo() string {
	var b [3]byte
	_, _ = rand.Read(b[:])
	return fmt.Sprintf("YH%d%06d", time.Now().UnixMilli(), int(b[0])<<16|int(b[1])<<8|int(b[2]))
}

func skuIDsFromItems(items []OrderItem) []uint64 {
	out := make([]uint64, 0, len(items))
	for _, item := range items {
		out = append(out, item.SKUID)
	}
	return out
}

func yuanToCents(value float64) uint64 { return uint64(math.Round(value * 100)) }
func centsText(value uint64) string    { return fmt.Sprintf("%.2f", float64(value)/100) }
