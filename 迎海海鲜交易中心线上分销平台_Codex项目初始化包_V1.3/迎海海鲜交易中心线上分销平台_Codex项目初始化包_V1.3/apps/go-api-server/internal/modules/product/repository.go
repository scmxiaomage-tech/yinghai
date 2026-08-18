package product

import (
	"errors"

	"gorm.io/gorm"
)

type SKUInventorySnapshot struct {
	SKUID uint64
	AvailableStock uint64
	WarningStock uint64
}

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) DB() *gorm.DB {
	return r.db
}

func (r *Repository) ListCategories(includeDisabled bool) ([]Category, error) {
	var list []Category
	query := r.db.Order("sort_order ASC, id ASC")
	if !includeDisabled {
		query = query.Where("status = ?", CategoryStatusEnabled)
	}
	err := query.Find(&list).Error
	return list, err
}

func (r *Repository) FindCategory(id uint64) (*Category, error) {
	var model Category
	if err := r.db.First(&model, id).Error; err != nil {
		return nil, err
	}
	return &model, nil
}

func (r *Repository) CreateCategory(model *Category) error {
	return r.db.Create(model).Error
}

func (r *Repository) UpdateCategory(id uint64, values map[string]any) error {
	result := r.db.Model(&Category{}).Where("id = ?", id).Updates(values)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) DeleteCategory(id uint64) error {
	var count int64
	if err := r.db.Model(&Product{}).Where("category_id = ? AND deleted_at IS NULL", id).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return ErrCategoryHasProducts
	}
	result := r.db.Delete(&Category{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) ListProducts(query ProductQuery) (PageResult[Product], error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 20
	}
	db := r.db.Model(&Product{}).Preload("Category").Preload("SKUs", "status = ?", SKUStatusEnabled)
	if query.CategoryID != nil {
		db = db.Where("category_id = ?", *query.CategoryID)
	}
	if query.Keyword != "" {
		like := "%" + query.Keyword + "%"
		db = db.Where("name LIKE ? OR subtitle LIKE ? OR product_no LIKE ?", like, like, like)
	}
	if query.OnlyOnSale {
		db = db.Where("shelf_status = ?", ProductShelfOnSale)
	}
	if query.RecommendedOnly {
		db = db.Where("recommend_status = ?", true)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return PageResult[Product]{}, err
	}
	switch query.Sort {
	case "price_asc":
		db = db.Order("(SELECT MIN(sale_price) FROM skus WHERE skus.product_id = products.id AND skus.status = 'enabled' AND skus.deleted_at IS NULL) ASC")
	case "price_desc":
		db = db.Order("(SELECT MIN(sale_price) FROM skus WHERE skus.product_id = products.id AND skus.status = 'enabled' AND skus.deleted_at IS NULL) DESC")
	default:
		db = db.Order("sort_order ASC, id DESC")
	}
	var list []Product
	err := db.Offset((query.Page - 1) * query.PageSize).Limit(query.PageSize).Find(&list).Error
	return PageResult[Product]{Page: query.Page, PageSize: query.PageSize, Total: total, Items: list}, err
}

func (r *Repository) FindProduct(id uint64, onlyOnSale bool) (*Product, error) {
	var model Product
	query := r.db.Preload("Category").Preload("Images", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC, id ASC")
	}).Preload("SKUs", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC, id ASC")
	})
	if onlyOnSale {
		query = query.Where("shelf_status = ?", ProductShelfOnSale)
	}
	if err := query.First(&model, id).Error; err != nil {
		return nil, err
	}
	return &model, nil
}

func (r *Repository) CreateProduct(model *Product) error {
	return r.db.Create(model).Error
}

func (r *Repository) UpdateProduct(id uint64, values map[string]any) error {
	result := r.db.Model(&Product{}).Where("id = ?", id).Updates(values)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) SetProductShelf(id uint64, status string) error {
	result := r.db.Model(&Product{}).Where("id = ?", id).Update("shelf_status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) CreateSKU(model *SKU) error {
	return r.db.Create(model).Error
}

func (r *Repository) UpdateSKU(id uint64, values map[string]any) error {
	result := r.db.Model(&SKU{}).Where("id = ?", id).Updates(values)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) DeleteSKU(id uint64) error {
	result := r.db.Delete(&SKU{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) AddImage(model *ProductImage) error {
	return r.db.Create(model).Error
}

func (r *Repository) DeleteImage(id uint64) error {
	result := r.db.Delete(&ProductImage{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) InventorySnapshots(skuIDs []uint64) (map[uint64]SKUInventorySnapshot, error) {
	out := map[uint64]SKUInventorySnapshot{}
	if len(skuIDs) == 0 {
		return out, nil
	}
	var rows []SKUInventorySnapshot
	err := r.db.Table("inventories").Select("sku_id, total_stock - locked_stock AS available_stock, warning_stock").Where("sku_id IN ?", skuIDs).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.SKUID] = row
	}
	return out, nil
}

var ErrCategoryHasProducts = errors.New("category has products")
