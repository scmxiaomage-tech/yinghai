package payment

import (
	"errors"
	"time"

	ordermodule "yinghai/go-api-server/internal/modules/order"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Transaction(fn func(tx *gorm.DB) error) error {
	return r.db.Transaction(fn)
}

func (r *Repository) FindReusablePending(orderID uint64, provider string, now time.Time) (*Payment, error) {
	var model Payment
	err := r.db.Where("order_id = ? AND provider = ? AND status = ? AND expire_at > ?", orderID, provider, StatusPending, now).Order("id DESC").First(&model).Error
	return &model, err
}

func (r *Repository) Create(tx *gorm.DB, model *Payment) error {
	return tx.Create(model).Error
}

func (r *Repository) Update(tx *gorm.DB, model *Payment) error {
	return tx.Save(model).Error
}

func (r *Repository) FindByID(id uint64) (*Payment, error) {
	var model Payment
	err := r.db.First(&model, id).Error
	return &model, err
}

func (r *Repository) FindByPaymentNo(paymentNo string) (*Payment, error) {
	var model Payment
	err := r.db.Where("payment_no = ?", paymentNo).First(&model).Error
	return &model, err
}

func (r *Repository) FindLatestByOrder(orderID uint64) (*Payment, error) {
	var model Payment
	err := r.db.Where("order_id = ?", orderID).Order("id DESC").First(&model).Error
	return &model, err
}

func (r *Repository) LockPaymentByNo(tx *gorm.DB, paymentNo string) (*Payment, error) {
	var model Payment
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("payment_no = ?", paymentNo).First(&model).Error
	return &model, err
}

func (r *Repository) LockOrder(tx *gorm.DB, orderID uint64) (*ordermodule.Order, error) {
	var model ordermodule.Order
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Items").First(&model, orderID).Error
	return &model, err
}

func (r *Repository) FindUserOrder(userID string, orderID uint64) (*ordermodule.Order, error) {
	var model ordermodule.Order
	err := r.db.Preload("Items").Where("id = ? AND user_id = ?", orderID, userID).First(&model).Error
	return &model, err
}

func (r *Repository) UpdateOrderPaid(tx *gorm.DB, orderID uint64, paidAt time.Time) (int64, error) {
	result := tx.Model(&ordermodule.Order{}).Where("id = ? AND status = ?", orderID, ordermodule.StatusPendingPayment).
		Updates(map[string]any{"status": ordermodule.StatusPaid, "paid_at": paidAt})
	return result.RowsAffected, result.Error
}

func (r *Repository) CreateEvent(tx *gorm.DB, event *PaymentEvent) error {
	return tx.Create(event).Error
}

func (r *Repository) MarkEventProcessed(tx *gorm.DB, eventID uint64, result string, message *string) error {
	now := time.Now()
	return tx.Model(&PaymentEvent{}).Where("id = ?", eventID).Updates(map[string]any{"processed": true, "process_result": result, "error_message": message, "processed_at": now}).Error
}

func (r *Repository) ListEvents(paymentID uint64) ([]PaymentEvent, error) {
	var events []PaymentEvent
	err := r.db.Where("payment_id = ?", paymentID).Order("id DESC").Find(&events).Error
	return events, err
}

func (r *Repository) ListPayments(query PaymentQuery) (PageResult[Payment], error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 20
	}
	db := r.db.Model(&Payment{})
	if query.PaymentNo != "" {
		db = db.Where("payment_no = ?", query.PaymentNo)
	}
	if query.OrderNo != "" {
		db = db.Where("order_no = ?", query.OrderNo)
	}
	if query.ProviderTradeNo != "" {
		db = db.Where("provider_trade_no = ?", query.ProviderTradeNo)
	}
	if query.UserID != "" {
		db = db.Where("user_id = ?", query.UserID)
	}
	if query.Provider != "" {
		db = db.Where("provider = ?", query.Provider)
	}
	if query.Status != "" && query.Status != "all" {
		db = db.Where("status = ?", query.Status)
	}
	if query.StartAt != "" {
		db = db.Where("created_at >= ?", query.StartAt)
	}
	if query.EndAt != "" {
		db = db.Where("created_at <= ?", query.EndAt)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return PageResult[Payment]{}, err
	}
	var items []Payment
	err := db.Order("id DESC").Offset((query.Page - 1) * query.PageSize).Limit(query.PageSize).Find(&items).Error
	return PageResult[Payment]{Page: query.Page, PageSize: query.PageSize, Total: total, Items: items}, err
}

func isNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}
