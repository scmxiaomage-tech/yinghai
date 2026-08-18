package product

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

const (
	CategoryStatusEnabled = "enabled"
	CategoryStatusDisabled = "disabled"
	ProductShelfDraft = "draft"
	ProductShelfOnSale = "on_sale"
	ProductShelfOffSale = "off_sale"
	SKUStatusEnabled = "enabled"
	SKUStatusDisabled = "disabled"
	ImageTypeMain = "main"
	ImageTypeDetail = "detail"
)

type Category struct {
	ID uint64 `gorm:"primaryKey;column:id" json:"id"`
	ParentID *uint64 `gorm:"column:parent_id" json:"parentId,omitempty"`
	Name string `gorm:"column:name" json:"name"`
	Code string `gorm:"column:code;uniqueIndex" json:"code"`
	IconURL *string `gorm:"column:icon_url" json:"iconUrl,omitempty"`
	ImageURL *string `gorm:"column:image_url" json:"imageUrl,omitempty"`
	SortOrder int `gorm:"column:sort_order" json:"sortOrder"`
	Status string `gorm:"column:status" json:"status"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`
}

type Product struct {
	ID uint64 `gorm:"primaryKey;column:id" json:"id"`
	ProductNo string `gorm:"column:product_no;uniqueIndex" json:"productNo"`
	CategoryID uint64 `gorm:"column:category_id" json:"categoryId"`
	Name string `gorm:"column:name" json:"name"`
	Subtitle *string `gorm:"column:subtitle" json:"subtitle,omitempty"`
	MainImageURL *string `gorm:"column:main_image_url" json:"mainImageUrl,omitempty"`
	Description *string `gorm:"column:description" json:"description,omitempty"`
	Unit string `gorm:"column:unit" json:"unit"`
	Origin *string `gorm:"column:origin" json:"origin,omitempty"`
	StorageMethod *string `gorm:"column:storage_method" json:"storageMethod,omitempty"`
	ShelfStatus string `gorm:"column:shelf_status" json:"shelfStatus"`
	RecommendStatus bool `gorm:"column:recommend_status" json:"recommendStatus"`
	SortOrder int `gorm:"column:sort_order" json:"sortOrder"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`
	Category Category `gorm:"foreignKey:CategoryID" json:"category"`
	Images []ProductImage `gorm:"foreignKey:ProductID" json:"images"`
	SKUs []SKU `gorm:"foreignKey:ProductID" json:"skus"`
}

type ProductImage struct {
	ID uint64 `gorm:"primaryKey;column:id" json:"id"`
	ProductID uint64 `gorm:"column:product_id" json:"productId"`
	ImageURL string `gorm:"column:image_url" json:"imageUrl"`
	ImageType string `gorm:"column:image_type" json:"imageType"`
	SortOrder int `gorm:"column:sort_order" json:"sortOrder"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type SKU struct {
	ID uint64 `gorm:"primaryKey;column:id" json:"id"`
	SKUNo string `gorm:"column:sku_no;uniqueIndex" json:"skuNo"`
	ProductID uint64 `gorm:"column:product_id" json:"productId"`
	Name string `gorm:"column:name" json:"name"`
	SpecJSON datatypes.JSON `gorm:"column:spec_json" json:"specJson"`
	CostPrice *float64 `gorm:"column:cost_price" json:"-"`
	SalePrice float64 `gorm:"column:sale_price" json:"salePrice"`
	MarketPrice *float64 `gorm:"column:market_price" json:"marketPrice,omitempty"`
	MemberPrice *float64 `gorm:"column:member_price" json:"memberPrice,omitempty"`
	Weight *float64 `gorm:"column:weight" json:"weight,omitempty"`
	WeightUnit *string `gorm:"column:weight_unit" json:"weightUnit,omitempty"`
	Status string `gorm:"column:status" json:"status"`
	SortOrder int `gorm:"column:sort_order" json:"sortOrder"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`
}
