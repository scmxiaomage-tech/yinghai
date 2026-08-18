package order

import "time"

type OrderItemInput struct {
	SKUID    uint64 `json:"skuId"`
	Quantity uint64 `json:"quantity"`
}

type PreviewOrderInput struct {
	Items []OrderItemInput `json:"items"`
}

type CreateOrderInput struct {
	Items           []OrderItemInput `json:"items"`
	ReceiverName    string           `json:"receiverName"`
	ReceiverPhone   string           `json:"receiverPhone"`
	ReceiverAddress string           `json:"receiverAddress"`
	BuyerRemark     *string          `json:"buyerRemark"`
	RequestID       string           `json:"requestId"`
	PriceSnapshot   string           `json:"priceSnapshot"`
}

type CancelOrderInput struct {
	CancelReason string `json:"cancelReason"`
}

type OrderQuery struct {
	UserID   string
	Status   string
	OrderNo  string
	Keyword  string
	Page     int
	PageSize int
}

type PageResult[T any] struct {
	Page     int   `json:"page"`
	PageSize int   `json:"pageSize"`
	Total    int64 `json:"total"`
	Items    []T   `json:"items"`
}

type ProductSnapshot struct {
	SKUID          uint64
	ProductID      uint64
	ProductName    string
	SKUName        string
	ProductImage   *string
	SKUStatus      string
	ShelfStatus    string
	SalePrice      float64
	AvailableStock uint64
}

type PreviewItemDTO struct {
	ProductID         uint64  `json:"productId"`
	SKUID             uint64  `json:"skuId"`
	ProductName       string  `json:"productName"`
	SKUName           string  `json:"skuName"`
	ProductImage      *string `json:"productImage,omitempty"`
	UnitPrice         uint64  `json:"unitPrice"`
	UnitPriceText     string  `json:"unitPriceText"`
	Quantity          uint64  `json:"quantity"`
	Subtotal          uint64  `json:"subtotal"`
	SubtotalText      string  `json:"subtotalText"`
	AvailableStock    uint64  `json:"availableStock"`
	Available         bool    `json:"available"`
	UnavailableReason *string `json:"unavailableReason,omitempty"`
}

type PreviewDTO struct {
	Items             []PreviewItemDTO `json:"items"`
	ItemAmount        uint64           `json:"itemAmount"`
	DiscountAmount    uint64           `json:"discountAmount"`
	ShippingAmount    uint64           `json:"shippingAmount"`
	PayableAmount     uint64           `json:"payableAmount"`
	ItemAmountText    string           `json:"itemAmountText"`
	PayableAmountText string           `json:"payableAmountText"`
	PriceSnapshot     string           `json:"priceSnapshot"`
}

type OrderItemDTO struct {
	ID            uint64  `json:"id"`
	ProductID     uint64  `json:"productId"`
	SKUID         uint64  `json:"skuId"`
	ProductName   string  `json:"productName"`
	SKUName       string  `json:"skuName"`
	ProductImage  *string `json:"productImage,omitempty"`
	UnitPrice     uint64  `json:"unitPrice"`
	UnitPriceText string  `json:"unitPriceText"`
	Quantity      uint64  `json:"quantity"`
	Subtotal      uint64  `json:"subtotal"`
	SubtotalText  string  `json:"subtotalText"`
}

type OrderDTO struct {
	ID                uint64         `json:"id"`
	OrderNo           string         `json:"orderNo"`
	Status            string         `json:"status"`
	ItemAmount        uint64         `json:"itemAmount"`
	DiscountAmount    uint64         `json:"discountAmount"`
	ShippingAmount    uint64         `json:"shippingAmount"`
	PayableAmount     uint64         `json:"payableAmount"`
	ItemAmountText    string         `json:"itemAmountText"`
	PayableAmountText string         `json:"payableAmountText"`
	ReceiverName      string         `json:"receiverName"`
	ReceiverPhone     string         `json:"receiverPhone"`
	ReceiverAddress   string         `json:"receiverAddress"`
	BuyerRemark       *string        `json:"buyerRemark,omitempty"`
	CancelReason      *string        `json:"cancelReason,omitempty"`
	ExpireAt          time.Time      `json:"expireAt"`
	CreatedAt         time.Time      `json:"createdAt"`
	CancelledAt       *time.Time     `json:"cancelledAt,omitempty"`
	ClosedAt          *time.Time     `json:"closedAt,omitempty"`
	Items             []OrderItemDTO `json:"items"`
}
