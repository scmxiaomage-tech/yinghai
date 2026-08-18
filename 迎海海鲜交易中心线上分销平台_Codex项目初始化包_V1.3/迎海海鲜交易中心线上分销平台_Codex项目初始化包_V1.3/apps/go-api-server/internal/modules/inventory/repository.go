package inventory

import (
	"errors"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindBySKUID(tx *gorm.DB, skuID uint64) (*Inventory, error) {
	var model Inventory
	if err := tx.Where("sku_id = ?", skuID).First(&model).Error; err != nil {
		return nil, err
	}
	return &model, nil
}

func (r *Repository) EnsureInventory(tx *gorm.DB, skuID uint64) (*Inventory, error) {
	model, err := r.FindBySKUID(tx, skuID)
	if err == nil {
		return model, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	model = &Inventory{SKUID: skuID}
	if err := tx.Create(model).Error; err != nil {
		return nil, err
	}
	return model, nil
}

func (r *Repository) Transaction(fn func(tx *gorm.DB) error) error {
	return r.db.Transaction(fn)
}

func (r *Repository) AtomicLock(tx *gorm.DB, skuID uint64, quantity uint64) (int64, error) {
	result := tx.Model(&Inventory{}).Where("sku_id = ? AND total_stock - locked_stock >= ?", skuID, quantity).
		Updates(map[string]any{"locked_stock": gorm.Expr("locked_stock + ?", quantity), "version": gorm.Expr("version + 1")})
	return result.RowsAffected, result.Error
}

func (r *Repository) AtomicUnlock(tx *gorm.DB, skuID uint64, quantity uint64) (int64, error) {
	result := tx.Model(&Inventory{}).Where("sku_id = ? AND locked_stock >= ?", skuID, quantity).
		Updates(map[string]any{"locked_stock": gorm.Expr("locked_stock - ?", quantity), "version": gorm.Expr("version + 1")})
	return result.RowsAffected, result.Error
}

func (r *Repository) AtomicDeduct(tx *gorm.DB, skuID uint64, quantity uint64) (int64, error) {
	result := tx.Model(&Inventory{}).Where("sku_id = ? AND locked_stock >= ? AND total_stock >= ?", skuID, quantity, quantity).
		Updates(map[string]any{"total_stock": gorm.Expr("total_stock - ?", quantity), "locked_stock": gorm.Expr("locked_stock - ?", quantity), "sold_stock": gorm.Expr("sold_stock + ?", quantity), "version": gorm.Expr("version + 1")})
	return result.RowsAffected, result.Error
}

func (r *Repository) AtomicRefundReturn(tx *gorm.DB, skuID uint64, quantity uint64) (int64, error) {
	result := tx.Model(&Inventory{}).Where("sku_id = ? AND sold_stock >= ?", skuID, quantity).
		Updates(map[string]any{"total_stock": gorm.Expr("total_stock + ?", quantity), "sold_stock": gorm.Expr("sold_stock - ?", quantity), "version": gorm.Expr("version + 1")})
	return result.RowsAffected, result.Error
}

func (r *Repository) AtomicIncrease(tx *gorm.DB, skuID uint64, quantity uint64) (int64, error) {
	result := tx.Model(&Inventory{}).Where("sku_id = ?", skuID).
		Updates(map[string]any{"total_stock": gorm.Expr("total_stock + ?", quantity), "version": gorm.Expr("version + 1")})
	return result.RowsAffected, result.Error
}

func (r *Repository) AtomicDecrease(tx *gorm.DB, skuID uint64, quantity uint64) (int64, error) {
	result := tx.Model(&Inventory{}).Where("sku_id = ? AND total_stock - locked_stock >= ?", skuID, quantity).
		Updates(map[string]any{"total_stock": gorm.Expr("total_stock - ?", quantity), "version": gorm.Expr("version + 1")})
	return result.RowsAffected, result.Error
}

func (r *Repository) CreateTransaction(tx *gorm.DB, model *InventoryTransaction) error {
	return tx.Create(model).Error
}

func (r *Repository) FindTransactionByReference(tx *gorm.DB, skuID uint64, txType string, refType string, refID string) (*InventoryTransaction, error) {
	var model InventoryTransaction
	err := tx.Where("sku_id = ? AND type = ? AND reference_type = ? AND reference_id = ?", skuID, txType, refType, refID).First(&model).Error
	return &model, err
}

func (r *Repository) ListInventories(query InventoryQuery) (PageResult[InventoryDTO], error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 20
	}
	db := r.db.Table("inventories i").
		Select("i.sku_id, s.sku_no, s.name AS sku_name, p.id AS product_id, p.name AS product_name, i.total_stock, i.locked_stock, (i.total_stock - i.locked_stock) AS available_stock, i.sold_stock, i.warning_stock, i.version").
		Joins("JOIN skus s ON s.id = i.sku_id AND s.deleted_at IS NULL").
		Joins("JOIN products p ON p.id = s.product_id AND p.deleted_at IS NULL")
	if query.SKUID != nil {
		db = db.Where("i.sku_id = ?", *query.SKUID)
	}
	if query.ProductID != nil {
		db = db.Where("p.id = ?", *query.ProductID)
	}
	if query.Keyword != "" {
		like := "%" + query.Keyword + "%"
		db = db.Where("p.name LIKE ? OR s.name LIKE ? OR s.sku_no LIKE ?", like, like, like)
	}
	if query.LowStock {
		db = db.Where("i.total_stock - i.locked_stock > 0 AND i.total_stock - i.locked_stock <= i.warning_stock")
	}
	if query.OutOfStock {
		db = db.Where("i.total_stock - i.locked_stock <= 0")
	}
	if query.StockStatus == StatusLowStock {
		db = db.Where("i.total_stock - i.locked_stock > 0 AND i.total_stock - i.locked_stock <= i.warning_stock")
	}
	if query.StockStatus == StatusOutOfStock {
		db = db.Where("i.total_stock - i.locked_stock <= 0")
	}
	if query.StockStatus == StatusInStock {
		db = db.Where("i.total_stock - i.locked_stock > i.warning_stock")
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return PageResult[InventoryDTO]{}, err
	}
	var items []InventoryDTO
	if err := db.Order("p.id DESC, s.sort_order ASC").Offset((query.Page - 1) * query.PageSize).Limit(query.PageSize).Scan(&items).Error; err != nil {
		return PageResult[InventoryDTO]{}, err
	}
	for i := range items {
		items[i].StockStatus = stockStatus(items[i].AvailableStock, items[i].WarningStock)
	}
	return PageResult[InventoryDTO]{Page: query.Page, PageSize: query.PageSize, Total: total, Items: items}, nil
}

func (r *Repository) ListTransactions(query TransactionQuery) (PageResult[InventoryTransaction], error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 20
	}
	db := r.db.Model(&InventoryTransaction{})
	if query.SKUID != nil {
		db = db.Where("sku_id = ?", *query.SKUID)
	}
	if query.ProductID != nil {
		db = db.Where("sku_id IN (SELECT id FROM skus WHERE product_id = ?)", *query.ProductID)
	}
	if query.TransactionType != "" {
		db = db.Where("type = ?", query.TransactionType)
	}
	if query.StartAt != "" {
		db = db.Where("created_at >= ?", query.StartAt)
	}
	if query.EndAt != "" {
		db = db.Where("created_at <= ?", query.EndAt)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return PageResult[InventoryTransaction]{}, err
	}
	var items []InventoryTransaction
	if err := db.Order("id DESC").Offset((query.Page - 1) * query.PageSize).Limit(query.PageSize).Find(&items).Error; err != nil {
		return PageResult[InventoryTransaction]{}, err
	}
	return PageResult[InventoryTransaction]{Page: query.Page, PageSize: query.PageSize, Total: total, Items: items}, nil
}

func stockStatus(available uint64, warning uint64) string {
	if available == 0 {
		return StatusOutOfStock
	}
	if available <= warning {
		return StatusLowStock
	}
	return StatusInStock
}
