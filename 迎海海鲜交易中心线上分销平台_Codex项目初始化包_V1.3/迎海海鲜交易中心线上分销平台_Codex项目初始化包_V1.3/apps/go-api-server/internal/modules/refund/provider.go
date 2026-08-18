package refund

import (
	"context"
	"errors"
)

var (
	ErrRefundNotFound            = errors.New("REFUND_NOT_FOUND")
	ErrRefundAlreadyExists       = errors.New("REFUND_ALREADY_EXISTS")
	ErrRefundNotAllowed          = errors.New("REFUND_NOT_ALLOWED")
	ErrRefundAmountMismatch      = errors.New("REFUND_AMOUNT_MISMATCH")
	ErrRefundProviderError       = errors.New("REFUND_PROVIDER_ERROR")
	ErrRefundAlreadySuccess      = errors.New("REFUND_ALREADY_SUCCESS")
	ErrRefundInvalidState        = errors.New("REFUND_INVALID_STATE")
	ErrRefundNotificationInvalid = errors.New("REFUND_NOTIFICATION_INVALID")
	ErrRefundSignatureInvalid    = errors.New("REFUND_SIGNATURE_INVALID")
	ErrRefundConfigMissing       = errors.New("REFUND_CONFIG_MISSING")
)

type RefundProvider interface {
	Name() string
	CreateRefund(ctx context.Context, request RefundProviderRequest) (RefundProviderResponse, error)
	QueryRefund(ctx context.Context, refund *Refund) (RefundNotification, error)
	VerifyRefundNotification(ctx context.Context, headers map[string]string, body []byte) (RefundNotification, error)
}

type ProviderRegistry struct {
	providers map[string]RefundProvider
}

func NewProviderRegistry(providers ...RefundProvider) *ProviderRegistry {
	registry := &ProviderRegistry{providers: map[string]RefundProvider{}}
	for _, provider := range providers {
		if provider != nil {
			registry.providers[provider.Name()] = provider
		}
	}
	return registry
}

func (r *ProviderRegistry) Get(name string) (RefundProvider, error) {
	provider, ok := r.providers[name]
	if !ok {
		return nil, ErrRefundProviderError
	}
	return provider, nil
}
