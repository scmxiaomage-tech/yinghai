package payment

import (
	"context"

	"yinghai/go-api-server/internal/config"
)

type WechatPayProvider struct {
	cfg config.Config
}

func NewWechatPayProvider(cfg config.Config) *WechatPayProvider {
	return &WechatPayProvider{cfg: cfg}
}

func (p *WechatPayProvider) Name() string { return ProviderWechatPay }

func (p *WechatPayProvider) validateConfig() error {
	if p.cfg.WechatPayAppID == "" || p.cfg.WechatPayMchID == "" || p.cfg.WechatPayAPIv3Key == "" || p.cfg.WechatPayCertSerial == "" || p.cfg.WechatPayPrivateKeyPath == "" || p.cfg.WechatPayNotifyURL == "" {
		return ErrPaymentConfigMissing
	}
	return nil
}

func (p *WechatPayProvider) CreatePayment(ctx context.Context, request ProviderPaymentRequest) (ProviderPaymentResponse, error) {
	if err := p.validateConfig(); err != nil {
		return ProviderPaymentResponse{}, err
	}
	return ProviderPaymentResponse{}, ErrPaymentProviderError
}

func (p *WechatPayProvider) QueryPayment(ctx context.Context, model *Payment) (PaymentNotification, error) {
	if err := p.validateConfig(); err != nil {
		return PaymentNotification{}, err
	}
	return PaymentNotification{}, ErrPaymentQueryFailed
}

func (p *WechatPayProvider) ClosePayment(ctx context.Context, model *Payment) error {
	if err := p.validateConfig(); err != nil {
		return err
	}
	return ErrPaymentCloseFailed
}

func (p *WechatPayProvider) VerifyAndParseNotification(ctx context.Context, headers map[string]string, body []byte) (PaymentNotification, error) {
	if err := p.validateConfig(); err != nil {
		return PaymentNotification{}, err
	}
	return PaymentNotification{}, ErrPaymentSignatureInvalid
}
