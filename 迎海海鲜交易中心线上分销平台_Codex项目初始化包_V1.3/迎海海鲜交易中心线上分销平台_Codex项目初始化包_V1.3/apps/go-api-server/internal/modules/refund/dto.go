package refund

import "time"

type CreateRefundInput struct {
	Reason   string `json:"reason"`
	Provider string `json:"provider"`
}

type RefundProviderRequest struct {
	RefundNo        string
	OrderNo         string
	PaymentNo       string
	ProviderTradeNo string
	Amount          uint64
	Currency        string
	Reason          string
	NotifyURL       string
}

type RefundProviderResponse struct {
	ProviderRefundID string
	Status           string
	Raw              []byte
}

type RefundNotification struct {
	EventID          string
	MerchantRefundNo string
	ProviderRefundID string
	Status           string
	Amount           uint64
	Currency         string
	SuccessAt        time.Time
	PayloadHash      string
	RawPayload       []byte
}

type RefundDTO struct {
	ID               uint64     `json:"id"`
	RefundNo         string     `json:"refundNo"`
	OrderID          uint64     `json:"orderId"`
	OrderNo          string     `json:"orderNo"`
	PaymentID        uint64     `json:"paymentId"`
	PaymentNo        string     `json:"paymentNo"`
	UserID           string     `json:"userId,omitempty"`
	Provider         string     `json:"provider"`
	ProviderRefundID *string    `json:"providerRefundId,omitempty"`
	Amount           uint64     `json:"amount"`
	AmountText       string     `json:"amountText"`
	Currency         string     `json:"currency"`
	Status           string     `json:"status"`
	Reason           *string    `json:"reason,omitempty"`
	Source           string     `json:"source"`
	RequestedBy      string     `json:"requestedBy"`
	RequestedAt      time.Time  `json:"requestedAt"`
	SuccessAt        *time.Time `json:"successAt,omitempty"`
	FailedAt         *time.Time `json:"failedAt,omitempty"`
	ClosedAt         *time.Time `json:"closedAt,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
}

type AdminRefundDTO struct {
	RefundDTO
	Events []RefundEvent `json:"events,omitempty"`
}

type RefundQuery struct {
	RefundNo  string
	OrderNo   string
	PaymentNo string
	UserID    string
	Provider  string
	Status    string
	StartAt   string
	EndAt     string
	Page      int
	PageSize  int
}

type PageResult[T any] struct {
	Page     int   `json:"page"`
	PageSize int   `json:"pageSize"`
	Total    int64 `json:"total"`
	Items    []T   `json:"items"`
}
