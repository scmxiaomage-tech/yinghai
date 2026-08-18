package payment

import (
	"context"
	"errors"
)

var (
	ErrPaymentNotFound            = errors.New("PAYMENT_NOT_FOUND")
	ErrPaymentAlreadySuccess      = errors.New("PAYMENT_ALREADY_SUCCESS")
	ErrPaymentAlreadyClosed       = errors.New("PAYMENT_ALREADY_CLOSED")
	ErrPaymentCreateFailed        = errors.New("PAYMENT_CREATE_FAILED")
	ErrPaymentProviderError       = errors.New("PAYMENT_PROVIDER_ERROR")
	ErrPaymentQueryFailed         = errors.New("PAYMENT_QUERY_FAILED")
	ErrPaymentCloseFailed         = errors.New("PAYMENT_CLOSE_FAILED")
	ErrPaymentSignatureInvalid    = errors.New("PAYMENT_SIGNATURE_INVALID")
	ErrPaymentNotificationInvalid = errors.New("PAYMENT_NOTIFICATION_INVALID")
	ErrPaymentAmountMismatch      = errors.New("PAYMENT_AMOUNT_MISMATCH")
	ErrPaymentOrderInvalidStatus  = errors.New("PAYMENT_ORDER_INVALID_STATUS")
	ErrPaymentOrderExpired        = errors.New("PAYMENT_ORDER_EXPIRED")
	ErrPaymentDuplicateRequest    = errors.New("PAYMENT_DUPLICATE_REQUEST")
	ErrPaymentConfigMissing       = errors.New("PAYMENT_CONFIG_MISSING")
)

type PaymentProvider interface {
	Name() string
	CreatePayment(ctx context.Context, request ProviderPaymentRequest) (ProviderPaymentResponse, error)
	QueryPayment(ctx context.Context, payment *Payment) (PaymentNotification, error)
	ClosePayment(ctx context.Context, payment *Payment) error
	VerifyAndParseNotification(ctx context.Context, headers map[string]string, body []byte) (PaymentNotification, error)
}

type ProviderRegistry struct {
	providers map[string]PaymentProvider
}

func NewProviderRegistry(providers ...PaymentProvider) *ProviderRegistry {
	registry := &ProviderRegistry{providers: map[string]PaymentProvider{}}
	for _, provider := range providers {
		if provider != nil {
			registry.providers[provider.Name()] = provider
		}
	}
	return registry
}

func (r *ProviderRegistry) Get(name string) (PaymentProvider, error) {
	provider, ok := r.providers[name]
	if !ok {
		return nil, ErrPaymentProviderError
	}
	return provider, nil
}
