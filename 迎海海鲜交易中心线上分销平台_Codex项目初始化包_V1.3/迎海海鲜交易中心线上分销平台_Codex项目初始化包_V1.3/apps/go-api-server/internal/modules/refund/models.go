package refund

import (
	"time"

	"gorm.io/datatypes"
)

const (
	ProviderWechatPay = "WECHAT_PAY"
	ProviderMock      = "MOCK"
	CurrencyCNY       = "CNY"

	StatusPending    = "PENDING"
	StatusProcessing = "PROCESSING"
	StatusSuccess    = "SUCCESS"
	StatusFailed     = "FAILED"
	StatusClosed     = "CLOSED"

	SourceAdmin      = "ADMIN"
	SourcePaidCancel = "PAID_ORDER_CANCEL"

	EventRefundCreated                = "REFUND_CREATED"
	EventRefundSubmitted              = "REFUND_SUBMITTED"
	EventRefundProcessing             = "REFUND_PROCESSING"
	EventRefundSuccess                = "REFUND_SUCCESS"
	EventRefundFailed                 = "REFUND_FAILED"
	EventRefundNotificationReceived   = "REFUND_NOTIFICATION_RECEIVED"
	EventRefundNotificationDuplicated = "REFUND_NOTIFICATION_DUPLICATED"
	EventRefundAmountMismatch         = "REFUND_AMOUNT_MISMATCH"
	EventRefundStockReturned          = "REFUND_STOCK_RETURNED"
)

type Refund struct {
	ID               uint64         `gorm:"primaryKey;column:id" json:"id"`
	RefundNo         string         `gorm:"column:refund_no" json:"refundNo"`
	OrderID          uint64         `gorm:"column:order_id" json:"orderId"`
	OrderNo          string         `gorm:"column:order_no" json:"orderNo"`
	PaymentID        uint64         `gorm:"column:payment_id" json:"paymentId"`
	PaymentNo        string         `gorm:"column:payment_no" json:"paymentNo"`
	UserID           string         `gorm:"column:user_id" json:"userId"`
	Provider         string         `gorm:"column:provider" json:"provider"`
	ProviderRefundID *string        `gorm:"column:provider_refund_id" json:"providerRefundId,omitempty"`
	ProviderEventID  *string        `gorm:"column:provider_event_id" json:"providerEventId,omitempty"`
	Amount           uint64         `gorm:"column:amount" json:"amount"`
	Currency         string         `gorm:"column:currency" json:"currency"`
	Status           string         `gorm:"column:status" json:"status"`
	Reason           *string        `gorm:"column:reason" json:"reason,omitempty"`
	Source           string         `gorm:"column:source" json:"source"`
	RequestedBy      string         `gorm:"column:requested_by" json:"requestedBy"`
	RequestedAt      time.Time      `gorm:"column:requested_at" json:"requestedAt"`
	SuccessAt        *time.Time     `gorm:"column:success_at" json:"successAt,omitempty"`
	FailedAt         *time.Time     `gorm:"column:failed_at" json:"failedAt,omitempty"`
	ClosedAt         *time.Time     `gorm:"column:closed_at" json:"closedAt,omitempty"`
	ProviderResponse datatypes.JSON `gorm:"column:provider_response" json:"providerResponse,omitempty"`
	CreatedAt        time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt        time.Time      `gorm:"column:updated_at" json:"updatedAt"`
}

func (Refund) TableName() string { return "refunds" }

type RefundEvent struct {
	ID               uint64         `gorm:"primaryKey;column:id" json:"id"`
	RefundID         *uint64        `gorm:"column:refund_id" json:"refundId,omitempty"`
	RefundNo         string         `gorm:"column:refund_no" json:"refundNo"`
	EventType        string         `gorm:"column:event_type" json:"eventType"`
	OldStatus        *string        `gorm:"column:old_status" json:"oldStatus,omitempty"`
	NewStatus        *string        `gorm:"column:new_status" json:"newStatus,omitempty"`
	Provider         *string        `gorm:"column:provider" json:"provider,omitempty"`
	ProviderEventID  *string        `gorm:"column:provider_event_id" json:"providerEventId,omitempty"`
	ProviderRefundID *string        `gorm:"column:provider_refund_id" json:"providerRefundId,omitempty"`
	PayloadHash      string         `gorm:"column:payload_hash" json:"payloadHash"`
	Payload          datatypes.JSON `gorm:"column:payload" json:"payload,omitempty"`
	Processed        bool           `gorm:"column:processed" json:"processed"`
	ProcessResult    *string        `gorm:"column:process_result" json:"processResult,omitempty"`
	ErrorMessage     *string        `gorm:"column:error_message" json:"errorMessage,omitempty"`
	CreatedAt        time.Time      `gorm:"column:created_at" json:"createdAt"`
	ProcessedAt      *time.Time     `gorm:"column:processed_at" json:"processedAt,omitempty"`
}

func (RefundEvent) TableName() string { return "refund_events" }
