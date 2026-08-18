package payment

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
)

type MockPaymentProvider struct {
	enabled bool
	secret  string
	appEnv  string
}

func NewMockPaymentProvider(enabled bool, secret string, appEnv string) *MockPaymentProvider {
	return &MockPaymentProvider{enabled: enabled, secret: secret, appEnv: appEnv}
}

func (p *MockPaymentProvider) Name() string { return ProviderMock }

func (p *MockPaymentProvider) ensureAllowed() error {
	if p.appEnv == "production" || !p.enabled {
		return ErrPaymentConfigMissing
	}
	return nil
}

func (p *MockPaymentProvider) CreatePayment(ctx context.Context, request ProviderPaymentRequest) (ProviderPaymentResponse, error) {
	if err := p.ensureAllowed(); err != nil {
		return ProviderPaymentResponse{}, err
	}
	prepayID := "mock_prepay_" + request.PaymentNo
	return ProviderPaymentResponse{
		ProviderPrepayID: prepayID,
		ClientParams: map[string]string{
			"provider":  ProviderMock,
			"paymentNo": request.PaymentNo,
			"prepayId":  prepayID,
			"mockOnly":  "true",
		},
	}, nil
}

func (p *MockPaymentProvider) QueryPayment(ctx context.Context, model *Payment) (PaymentNotification, error) {
	if err := p.ensureAllowed(); err != nil {
		return PaymentNotification{}, err
	}
	if model.Status == StatusSuccess {
		paidAt := time.Now()
		if model.PaidAt != nil {
			paidAt = *model.PaidAt
		}
		tradeNo := ""
		if model.ProviderTradeNo != nil {
			tradeNo = *model.ProviderTradeNo
		}
		return PaymentNotification{Provider: ProviderMock, ProviderTradeNo: tradeNo, MerchantPaymentNo: model.PaymentNo, Status: StatusSuccess, Amount: model.Amount, Currency: model.Currency, PaidAt: paidAt, EventID: "mock_query_" + model.PaymentNo, PayloadHash: hashPayload([]byte(model.PaymentNo))}, nil
	}
	return PaymentNotification{Provider: ProviderMock, MerchantPaymentNo: model.PaymentNo, Status: model.Status, Amount: model.Amount, Currency: model.Currency, EventID: "mock_query_" + model.PaymentNo, PayloadHash: hashPayload([]byte(model.PaymentNo))}, nil
}

func (p *MockPaymentProvider) ClosePayment(ctx context.Context, model *Payment) error {
	return p.ensureAllowed()
}

func (p *MockPaymentProvider) VerifyAndParseNotification(ctx context.Context, headers map[string]string, body []byte) (PaymentNotification, error) {
	if err := p.ensureAllowed(); err != nil {
		return PaymentNotification{}, err
	}
	signature := headers["X-Mock-Payment-Signature"]
	if signature == "" || !hmac.Equal([]byte(signature), []byte(p.sign(body))) {
		return PaymentNotification{}, ErrPaymentSignatureInvalid
	}
	var payload struct {
		PaymentNo       string `json:"paymentNo"`
		ProviderTradeNo string `json:"providerTradeNo"`
		Status          string `json:"status"`
		Amount          uint64 `json:"amount"`
		Currency        string `json:"currency"`
		EventID         string `json:"eventId"`
		PaidAt          string `json:"paidAt"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return PaymentNotification{}, ErrPaymentNotificationInvalid
	}
	if payload.PaymentNo == "" || payload.Status == "" {
		return PaymentNotification{}, ErrPaymentNotificationInvalid
	}
	paidAt := time.Now()
	if payload.PaidAt != "" {
		if parsed, err := time.Parse(time.RFC3339, payload.PaidAt); err == nil {
			paidAt = parsed
		}
	}
	if payload.Currency == "" {
		payload.Currency = CurrencyCNY
	}
	if payload.EventID == "" {
		sum := sha256.Sum256(body)
		payload.EventID = fmt.Sprintf("mock_%s_%x", payload.PaymentNo, sum[:4])
	}
	return PaymentNotification{Provider: ProviderMock, ProviderTradeNo: payload.ProviderTradeNo, MerchantPaymentNo: payload.PaymentNo, Status: payload.Status, Amount: payload.Amount, Currency: payload.Currency, PaidAt: paidAt, EventID: payload.EventID, PayloadHash: hashPayload(body)}, nil
}

func (p *MockPaymentProvider) sign(body []byte) string {
	mac := hmac.New(sha256.New, []byte(p.secret))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

func hashPayload(body []byte) string {
	sum := sha256.Sum256(body)
	return hex.EncodeToString(sum[:])
}
