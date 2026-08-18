package order

import "time"

const (
	StatusPendingPayment         = "PENDING_PAYMENT"
	StatusCancelled              = "CANCELLED"
	StatusClosed                 = "CLOSED"
	StatusPaid                   = "PAID"
	StatusRefunding              = "REFUNDING"
	StatusRefunded               = "REFUNDED"
	InventoryReferenceTypeOrder  = "ORDER"
	InventoryReferenceTypeRefund = "REFUND"
)

type Order struct {
	ID              uint64      `gorm:"primaryKey;column:id" json:"id"`
	OrderNo         string      `gorm:"column:order_no" json:"orderNo"`
	UserID          string      `gorm:"column:user_id" json:"userId"`
	RequestID       string      `gorm:"column:request_id" json:"requestId"`
	Status          string      `gorm:"column:status" json:"status"`
	ItemAmount      uint64      `gorm:"column:item_amount" json:"itemAmount"`
	DiscountAmount  uint64      `gorm:"column:discount_amount" json:"discountAmount"`
	ShippingAmount  uint64      `gorm:"column:shipping_amount" json:"shippingAmount"`
	PayableAmount   uint64      `gorm:"column:payable_amount" json:"payableAmount"`
	ReceiverName    string      `gorm:"column:receiver_name" json:"receiverName"`
	ReceiverPhone   string      `gorm:"column:receiver_phone" json:"receiverPhone"`
	ReceiverAddress string      `gorm:"column:receiver_address" json:"receiverAddress"`
	BuyerRemark     *string     `gorm:"column:buyer_remark" json:"buyerRemark,omitempty"`
	CancelReason    *string     `gorm:"column:cancel_reason" json:"cancelReason,omitempty"`
	ExpireAt        time.Time   `gorm:"column:expire_at" json:"expireAt"`
	PaidAt          *time.Time  `gorm:"column:paid_at" json:"paidAt,omitempty"`
	CancelledAt     *time.Time  `gorm:"column:cancelled_at" json:"cancelledAt,omitempty"`
	ClosedAt        *time.Time  `gorm:"column:closed_at" json:"closedAt,omitempty"`
	CreatedAt       time.Time   `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt       time.Time   `gorm:"column:updated_at" json:"updatedAt"`
	Items           []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
}

func (Order) TableName() string { return "orders" }

type OrderItem struct {
	ID           uint64    `gorm:"primaryKey;column:id" json:"id"`
	OrderID      uint64    `gorm:"column:order_id" json:"orderId"`
	ProductID    uint64    `gorm:"column:product_id" json:"productId"`
	SKUID        uint64    `gorm:"column:sku_id" json:"skuId"`
	ProductName  string    `gorm:"column:product_name" json:"productName"`
	SKUName      string    `gorm:"column:sku_name" json:"skuName"`
	ProductImage *string   `gorm:"column:product_image" json:"productImage,omitempty"`
	UnitPrice    uint64    `gorm:"column:unit_price" json:"unitPrice"`
	Quantity     uint64    `gorm:"column:quantity" json:"quantity"`
	Subtotal     uint64    `gorm:"column:subtotal" json:"subtotal"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"createdAt"`
}

func (OrderItem) TableName() string { return "order_items" }
