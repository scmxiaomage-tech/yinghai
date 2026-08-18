package inventory

import "time"

const (
	TxIncrease       = "INCREASE"
	TxDecrease       = "DECREASE"
	TxLock           = "LOCK"
	TxUnlock         = "UNLOCK"
	TxDeduct         = "DEDUCT"
	TxRefundReturn   = "REFUND_RETURN"
	StatusInStock    = "IN_STOCK"
	StatusLowStock   = "LOW_STOCK"
	StatusOutOfStock = "OUT_OF_STOCK"
)

type Inventory struct {
	ID           uint64    `gorm:"primaryKey;column:id" json:"id"`
	SKUID        uint64    `gorm:"column:sku_id;uniqueIndex" json:"skuId"`
	TotalStock   uint64    `gorm:"column:total_stock" json:"totalStock"`
	LockedStock  uint64    `gorm:"column:locked_stock" json:"lockedStock"`
	SoldStock    uint64    `gorm:"column:sold_stock" json:"soldStock"`
	WarningStock uint64    `gorm:"column:warning_stock" json:"warningStock"`
	Version      uint64    `gorm:"column:version" json:"version"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updatedAt"`
}

type InventoryTransaction struct {
	ID                uint64    `gorm:"primaryKey;column:id" json:"id"`
	SKUID             uint64    `gorm:"column:sku_id" json:"skuId"`
	Type              string    `gorm:"column:type" json:"type"`
	Quantity          uint64    `gorm:"column:quantity" json:"quantity"`
	BeforeStock       uint64    `gorm:"column:before_stock" json:"beforeStock"`
	AfterStock        uint64    `gorm:"column:after_stock" json:"afterStock"`
	BeforeLockedStock uint64    `gorm:"column:before_locked_stock" json:"beforeLockedStock"`
	AfterLockedStock  uint64    `gorm:"column:after_locked_stock" json:"afterLockedStock"`
	ReferenceType     *string   `gorm:"column:reference_type" json:"referenceType,omitempty"`
	ReferenceID       *string   `gorm:"column:reference_id" json:"referenceId,omitempty"`
	Remark            *string   `gorm:"column:remark" json:"remark,omitempty"`
	OperatorType      string    `gorm:"column:operator_type" json:"operatorType"`
	OperatorID        *string   `gorm:"column:operator_id" json:"operatorId,omitempty"`
	CreatedAt         time.Time `gorm:"column:created_at" json:"createdAt"`
}
