package cart

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) ListRows(userID string) ([]CartRow, error) {
	var rows []CartRow
	err := r.db.Table("cart_items ci").
		Select("ci.id, ci.product_id, ci.sku_id, p.name AS product_name, s.name AS sku_name, p.main_image_url, ci.quantity, ci.selected, s.sale_price, s.market_price, s.status AS sku_status, p.shelf_status, COALESCE(i.total_stock - i.locked_stock, 0) AS available_stock").
		Joins("LEFT JOIN products p ON p.id = ci.product_id AND p.deleted_at IS NULL").
		Joins("LEFT JOIN skus s ON s.id = ci.sku_id AND s.deleted_at IS NULL").
		Joins("LEFT JOIN inventories i ON i.sku_id = ci.sku_id").
		Where("ci.user_id = ?", userID).
		Order("ci.updated_at DESC, ci.id DESC").
		Scan(&rows).Error
	return rows, err
}

func (r *Repository) AddOrIncrement(userID string, productID uint64, skuID uint64, quantity uint64) error {
	item := &CartItem{UserID: userID, ProductID: productID, SKUID: skuID, Quantity: quantity, Selected: true}
	return r.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}, {Name: "sku_id"}},
		DoUpdates: clause.Assignments(map[string]any{
			"quantity": gorm.Expr("LEAST(quantity + VALUES(quantity), ?)", MaxQuantity),
			"selected": true,
		}),
	}).Create(item).Error
}

func (r *Repository) UpdateQuantity(userID string, id uint64, quantity uint64) error {
	result := r.db.Model(&CartItem{}).Where("id = ? AND user_id = ?", id, userID).Update("quantity", quantity)
	if result.Error != nil { return result.Error }
	if result.RowsAffected == 0 { return gorm.ErrRecordNotFound }
	return nil
}

func (r *Repository) UpdateSelected(userID string, id uint64, selected bool) error {
	result := r.db.Model(&CartItem{}).Where("id = ? AND user_id = ?", id, userID).Update("selected", selected)
	if result.Error != nil { return result.Error }
	if result.RowsAffected == 0 { return gorm.ErrRecordNotFound }
	return nil
}

func (r *Repository) UpdateSelection(userID string, ids []uint64, selected bool) error {
	query := r.db.Model(&CartItem{}).Where("user_id = ?", userID)
	if len(ids) > 0 { query = query.Where("id IN ?", ids) }
	return query.Update("selected", selected).Error
}

func (r *Repository) RemoveItem(userID string, id uint64) error {
	result := r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&CartItem{})
	if result.Error != nil { return result.Error }
	if result.RowsAffected == 0 { return gorm.ErrRecordNotFound }
	return nil
}

func (r *Repository) RemoveItems(userID string, ids []uint64) error {
	if len(ids) == 0 { return nil }
	return r.db.Where("user_id = ? AND id IN ?", userID, ids).Delete(&CartItem{}).Error
}

func (r *Repository) FindSKUProduct(skuID uint64) (uint64, string, string, uint64, error) {
	var row struct {
		ProductID uint64
		SKUStatus string
		ShelfStatus string
		AvailableStock uint64
	}
	result := r.db.Table("skus s").
		Select("s.product_id, s.status AS sku_status, p.shelf_status, COALESCE(i.total_stock - i.locked_stock, 0) AS available_stock").
		Joins("JOIN products p ON p.id = s.product_id AND p.deleted_at IS NULL").
		Joins("LEFT JOIN inventories i ON i.sku_id = s.id").
		Where("s.id = ? AND s.deleted_at IS NULL", skuID).
		Scan(&row)
	if result.Error != nil { return 0, "", "", 0, result.Error }
	if result.RowsAffected == 0 { return 0, "", "", 0, gorm.ErrRecordNotFound }
	return row.ProductID, row.SKUStatus, row.ShelfStatus, row.AvailableStock, nil
}
