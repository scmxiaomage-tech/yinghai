package payment

import "time"

type CreatePaymentInput struct {
	Provider        string `json:"provider"`
	ClientRequestID string `json:"clientRequestId"`
}

type ProviderPaymentRequest struct {
	PaymentNo   string
	OrderNo     string
	Description string
	Amount      uint64
	Currency    string
	ExpireAt    time.Time
	NotifyURL   string
	OpenID      string
}

type ProviderPaymentResponse struct {
	ProviderPrepayID string            `json:"providerPrepayId"`
	ClientParams     map[string]string `json:"clientParams"`
}

type PaymentNotification struct {
	Provider          string
	ProviderTradeNo   string
	MerchantPaymentNo string
	Status            string
	Amount            uint64
	Currency          string
	PaidAt            time.Time
	EventID           string
	PayloadHash       string
}

type PaymentDTO struct {
	ID               uint64            `json:"id"`
	PaymentNo        string            `json:"paymentNo"`
	OrderID          uint64            `json:"orderId"`
	OrderNo          string            `json:"orderNo"`
	Provider         string            `json:"provider"`
	Channel          string            `json:"channel"`
	Status           string            `json:"status"`
	Amount           uint64            `json:"amount"`
	AmountText       string            `json:"amountText"`
	Currency         string            `json:"currency"`
	ProviderTradeNo  *string           `json:"providerTradeNo,omitempty"`
	ProviderPrepayID *string           `json:"providerPrepayId,omitempty"`
	ClientParams     map[string]string `json:"clientParams,omitempty"`
	ExpireAt         time.Time         `json:"expireAt"`
	PaidAt           *time.Time        `json:"paidAt,omitempty"`
	CreatedAt        time.Time         `json:"createdAt"`
}

type PaymentStatusDTO struct {
	OrderID     uint64      `json:"orderId"`
	OrderNo     string      `json:"orderNo"`
	OrderStatus string      `json:"orderStatus"`
	Payment     *PaymentDTO `json:"payment,omitempty"`
}

type AdminPaymentDTO struct {
	PaymentDTO
	UserID string         `json:"userId"`
	Events []PaymentEvent `json:"events,omitempty"`
}

type PaymentQuery struct {
	PaymentNo       string
	OrderNo         string
	ProviderTradeNo string
	UserID          string
	Provider        string
	Status          string
	StartAt         string
	EndAt           string
	Page            int
	PageSize        int
}

type PageResult[T any] struct {
	Page     int   `json:"page"`
	PageSize int   `json:"pageSize"`
	Total    int64 `json:"total"`
	Items    []T   `json:"items"`
}
