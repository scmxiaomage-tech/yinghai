package refund

import (
	"time"

	ordermodule "yinghai/go-api-server/internal/modules/order"
	paymentmodule "yinghai/go-api-server/internal/modules/payment"

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

func (r *Repository) Create(tx *gorm.DB, model *Refund) error {
	return tx.Create(model).Error
}

func (r *Repository) Update(tx *gorm.DB, model *Refund) error {
	return tx.Save(model).Error
}

func (r *Repository) FindByID(id uint64) (*Refund, error) {
	var model Refund
	err := r.db.First(&model, id).Error
	return &model, err
}

func (r *Repository) FindByOrder(orderID uint64) (*Refund, error) {
	var model Refund
	err := r.db.Where("order_id = ?", orderID).Order("id DESC").First(&model).Error
	return &model, err
}

func (r *Repository) FindByRefundNo(refundNo string) (*Refund, error) {
	var model Refund
	err := r.db.Where("refund_no = ?", refundNo).First(&model).Error
	return &model, err
}

func (r *Repository) LockRefundByNo(tx *gorm.DB, refundNo string) (*Refund, error) {
	var model Refund
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("refund_no = ?", refundNo).First(&model).Error
	return &model, err
}

func (r *Repository) LockOrder(tx *gorm.DB, orderID uint64) (*ordermodule.Order, error) {
	var model ordermodule.Order
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Items").First(&model, orderID).Error
	return &model, err
}

func (r *Repository) LockPayment(tx *gorm.DB, paymentID uint64) (*paymentmodule.Payment, error) {
	var model paymentmodule.Payment
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&model, paymentID).Error
	return &model, err
}

func (r *Repository) LatestSuccessfulPayment(tx *gorm.DB, orderID uint64) (*paymentmodule.Payment, error) {
	var model paymentmodule.Payment
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("order_id = ? AND status = ?", orderID, paymentmodule.StatusSuccess).Order("id DESC").First(&model).Error
	return &model, err
}

func (r *Repository) UpdateOrderStatus(tx *gorm.DB, orderID uint64, from string, to string, values map[string]any) (int64, error) {
	query := tx.Model(&ordermodule.Order{}).Where("id = ? AND status = ?", orderID, from)
	values["status"] = to
	result := query.Updates(values)
	return result.RowsAffected, result.Error
}

func (r *Repository) CreateEvent(tx *gorm.DB, event *RefundEvent) error {
	return tx.Create(event).Error
}

func (r *Repository) MarkEventProcessed(tx *gorm.DB, eventID uint64, result string, message *string) error {
	now := time.Now()
	return tx.Model(&RefundEvent{}).Where("id = ?", eventID).Updates(map[string]any{"processed": true, "process_result": result, "error_message": message, "processed_at": now}).Error
}

func (r *Repository) ListEvents(refundID uint64) ([]RefundEvent, error) {
	var events []RefundEvent
	err := r.db.Where("refund_id = ?", refundID).Order("id DESC").Find(&events).Error
	return events, err
}

func (r *Repository) ListRefunds(query RefundQuery) (PageResult[Refund], error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 20
	}
	db := r.db.Model(&Refund{})
	if query.RefundNo != "" {
		db = db.Where("refund_no = ?", query.RefundNo)
	}
	if query.OrderNo != "" {
		db = db.Where("order_no = ?", query.OrderNo)
	}
	if query.PaymentNo != "" {
		db = db.Where("payment_no = ?", query.PaymentNo)
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
		return PageResult[Refund]{}, err
	}
	var items []Refund
	err := db.Order("id DESC").Offset((query.Page - 1) * query.PageSize).Limit(query.PageSize).Find(&items).Error
	return PageResult[Refund]{Page: query.Page, PageSize: query.PageSize, Total: total, Items: items}, err
}
