package payment

import "time"

const (
	ProviderWechatPay = "WECHAT_PAY"
	ProviderMock      = "MOCK"

	ChannelMiniapp = "MINIAPP"
	CurrencyCNY    = "CNY"

	StatusCreated = "CREATED"
	StatusPending = "PENDING"
	StatusSuccess = "SUCCESS"
	StatusClosed  = "CLOSED"
	StatusFailed  = "FAILED"

	EventCreate         = "CREATE"
	EventNotify         = "NOTIFY"
	EventQuery          = "QUERY"
	EventClose          = "CLOSE"
	EventAmountMismatch = "PAYMENT_AMOUNT_MISMATCH"
)

type Payment struct {
	ID               uint64     `gorm:"primaryKey;column:id" json:"id"`
	PaymentNo        string     `gorm:"column:payment_no" json:"paymentNo"`
	OrderID          uint64     `gorm:"column:order_id" json:"orderId"`
	OrderNo          string     `gorm:"column:order_no" json:"orderNo"`
	UserID           string     `gorm:"column:user_id" json:"userId"`
	Provider         string     `gorm:"column:provider" json:"provider"`
	Channel          string     `gorm:"column:channel" json:"channel"`
	Status           string     `gorm:"column:status" json:"status"`
	Amount           uint64     `gorm:"column:amount" json:"amount"`
	Currency         string     `gorm:"column:currency" json:"currency"`
	ProviderTradeNo  *string    `gorm:"column:provider_trade_no" json:"providerTradeNo,omitempty"`
	ProviderPrepayID *string    `gorm:"column:provider_prepay_id" json:"providerPrepayId,omitempty"`
	ClientRequestID  *string    `gorm:"column:client_request_id" json:"clientRequestId,omitempty"`
	ExpireAt         time.Time  `gorm:"column:expire_at" json:"expireAt"`
	PaidAt           *time.Time `gorm:"column:paid_at" json:"paidAt,omitempty"`
	ClosedAt         *time.Time `gorm:"column:closed_at" json:"closedAt,omitempty"`
	FailedAt         *time.Time `gorm:"column:failed_at" json:"failedAt,omitempty"`
	CreatedAt        time.Time  `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt        time.Time  `gorm:"column:updated_at" json:"updatedAt"`
}

func (Payment) TableName() string { return "payments" }

type PaymentEvent struct {
	ID              uint64     `gorm:"primaryKey;column:id" json:"id"`
	PaymentID       *uint64    `gorm:"column:payment_id" json:"paymentId,omitempty"`
	PaymentNo       string     `gorm:"column:payment_no" json:"paymentNo"`
	Provider        string     `gorm:"column:provider" json:"provider"`
	EventType       string     `gorm:"column:event_type" json:"eventType"`
	ProviderEventID *string    `gorm:"column:provider_event_id" json:"providerEventId,omitempty"`
	ProviderTradeNo *string    `gorm:"column:provider_trade_no" json:"providerTradeNo,omitempty"`
	PayloadHash     string     `gorm:"column:payload_hash" json:"payloadHash"`
	Processed       bool       `gorm:"column:processed" json:"processed"`
	ProcessResult   *string    `gorm:"column:process_result" json:"processResult,omitempty"`
	ErrorMessage    *string    `gorm:"column:error_message" json:"errorMessage,omitempty"`
	CreatedAt       time.Time  `gorm:"column:created_at" json:"createdAt"`
	ProcessedAt     *time.Time `gorm:"column:processed_at" json:"processedAt,omitempty"`
}

func (PaymentEvent) TableName() string { return "payment_events" }
