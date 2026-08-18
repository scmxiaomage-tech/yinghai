package cart

import "time"

const (
	MaxQuantity = 999
	ReasonProductOffShelf = "PRODUCT_OFF_SHELF"
	ReasonSKUDisabled = "SKU_DISABLED"
	ReasonOutOfStock = "OUT_OF_STOCK"
	ReasonInsufficientStock = "INSUFFICIENT_STOCK"
)

type CartItem struct {
	ID uint64 `gorm:"primaryKey;column:id" json:"id"`
	UserID string `gorm:"column:user_id" json:"userId"`
	ProductID uint64 `gorm:"column:product_id" json:"productId"`
	SKUID uint64 `gorm:"column:sku_id" json:"skuId"`
	Quantity uint64 `gorm:"column:quantity" json:"quantity"`
	Selected bool `gorm:"column:selected" json:"selected"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

func (CartItem) TableName() string {
	return "cart_items"
}
