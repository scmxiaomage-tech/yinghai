package refund

import (
	"context"

	"yinghai/go-api-server/internal/config"
)

type WechatRefundProvider struct {
	cfg config.Config
}

func NewWechatRefundProvider(cfg config.Config) *WechatRefundProvider {
	return &WechatRefundProvider{cfg: cfg}
}

func (p *WechatRefundProvider) Name() string { return ProviderWechatPay }

func (p *WechatRefundProvider) ensureConfigured() error {
	if p.cfg.WechatPayMchID == "" || p.cfg.WechatPayAPIv3Key == "" || p.cfg.WechatPayCertSerial == "" || p.cfg.WechatPayPrivateKeyPath == "" {
		return ErrRefundConfigMissing
	}
	return nil
}

func (p *WechatRefundProvider) CreateRefund(ctx context.Context, request RefundProviderRequest) (RefundProviderResponse, error) {
	if err := p.ensureConfigured(); err != nil {
		return RefundProviderResponse{}, err
	}
	return RefundProviderResponse{}, ErrRefundProviderError
}

func (p *WechatRefundProvider) QueryRefund(ctx context.Context, model *Refund) (RefundNotification, error) {
	if err := p.ensureConfigured(); err != nil {
		return RefundNotification{}, err
	}
	return RefundNotification{}, ErrRefundProviderError
}

func (p *WechatRefundProvider) VerifyRefundNotification(ctx context.Context, headers map[string]string, body []byte) (RefundNotification, error) {
	if err := p.ensureConfigured(); err != nil {
		return RefundNotification{}, err
	}
	return RefundNotification{}, ErrRefundSignatureInvalid
}
