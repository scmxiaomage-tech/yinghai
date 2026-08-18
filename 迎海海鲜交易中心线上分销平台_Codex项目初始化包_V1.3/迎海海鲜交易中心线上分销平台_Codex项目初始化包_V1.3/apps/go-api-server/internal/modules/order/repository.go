package order

import (
	"gorm.io/gorm"
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

func (r *Repository) ProductSnapshots(skuIDs []uint64) (map[uint64]ProductSnapshot, error) {
	out := map[uint64]ProductSnapshot{}
	if len(skuIDs) == 0 {
		return out, nil
	}
	var rows []ProductSnapshot
	err := r.db.Table("skus s").
		Select("s.id AS sku_id, s.product_id, p.name AS product_name, s.name AS sku_name, p.main_image_url AS product_image, s.status AS sku_status, p.shelf_status, s.sale_price, COALESCE(i.total_stock - i.locked_stock, 0) AS available_stock").
		Joins("JOIN products p ON p.id = s.product_id AND p.deleted_at IS NULL").
		Joins("LEFT JOIN inventories i ON i.sku_id = s.id").
		Where("s.id IN ? AND s.deleted_at IS NULL", skuIDs).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.SKUID] = row
	}
	return out, nil
}

func (r *Repository) FindByUserRequest(userID string, requestID string) (*Order, error) {
	var model Order
	err := r.db.Preload("Items").Where("user_id = ? AND request_id = ?", userID, requestID).First(&model).Error
	return &model, err
}

func (r *Repository) CreateOrder(tx *gorm.DB, model *Order) error {
	return tx.Create(model).Error
}

func (r *Repository) CreateItems(tx *gorm.DB, items []OrderItem) error {
	if len(items) == 0 {
		return nil
	}
	return tx.Create(&items).Error
}

func (r *Repository) FindUserOrder(userID string, id uint64) (*Order, error) {
	var model Order
	err := r.db.Preload("Items").Where("id = ? AND user_id = ?", id, userID).First(&model).Error
	return &model, err
}

func (r *Repository) FindOrder(id uint64) (*Order, error) {
	var model Order
	err := r.db.Preload("Items").First(&model, id).Error
	return &model, err
}

func (r *Repository) ListOrders(query OrderQuery) (PageResult[Order], error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 20
	}
	db := r.db.Model(&Order{}).Preload("Items")
	if query.UserID != "" {
		db = db.Where("user_id = ?", query.UserID)
	}
	if query.Status != "" && query.Status != "all" {
		db = db.Where("status = ?", normalizeStatus(query.Status))
	}
	if query.OrderNo != "" {
		db = db.Where("order_no = ?", query.OrderNo)
	}
	if query.Keyword != "" {
		like := "%" + query.Keyword + "%"
		db = db.Where("order_no LIKE ? OR id IN (SELECT order_id FROM order_items WHERE product_name LIKE ? OR sku_name LIKE ?)", like, like, like)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return PageResult[Order]{}, err
	}
	var items []Order
	err := db.Order("id DESC").Offset((query.Page - 1) * query.PageSize).Limit(query.PageSize).Find(&items).Error
	return PageResult[Order]{Page: query.Page, PageSize: query.PageSize, Total: total, Items: items}, err
}

func (r *Repository) UpdateStatusIfPending(tx *gorm.DB, id uint64, userID string, status string, values map[string]any) (int64, error) {
	query := tx.Model(&Order{}).Where("id = ? AND status = ?", id, StatusPendingPayment)
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	values["status"] = status
	result := query.Updates(values)
	return result.RowsAffected, result.Error
}

func (r *Repository) ExpiredPendingOrders(limit int) ([]Order, error) {
	if limit <= 0 {
		limit = 50
	}
	var orders []Order
	err := r.db.Preload("Items").Where("status = ? AND expire_at <= NOW(3)", StatusPendingPayment).Order("expire_at ASC").Limit(limit).Find(&orders).Error
	return orders, err
}

func (r *Repository) RemoveCartItemsBySKU(userID string, skuIDs []uint64) error {
	if len(skuIDs) == 0 {
		return nil
	}
	return r.db.Exec("DELETE FROM cart_items WHERE user_id = ? AND sku_id IN ?", userID, skuIDs).Error
}

func normalizeStatus(status string) string {
	switch status {
	case "pending_payment":
		return StatusPendingPayment
	case "cancelled":
		return StatusCancelled
	case "closed":
		return StatusClosed
	case "paid":
		return StatusPaid
	case "refunding":
		return StatusRefunding
	case "refunded":
		return StatusRefunded
	default:
		return status
	}
}
