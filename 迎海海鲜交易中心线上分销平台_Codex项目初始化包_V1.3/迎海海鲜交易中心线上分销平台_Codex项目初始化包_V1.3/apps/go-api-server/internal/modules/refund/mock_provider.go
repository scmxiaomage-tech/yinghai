package refund

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"time"
)

type MockRefundProvider struct {
	enabled bool
	secret  string
	appEnv  string
}

func NewMockRefundProvider(enabled bool, secret string, appEnv string) *MockRefundProvider {
	return &MockRefundProvider{enabled: enabled, secret: secret, appEnv: appEnv}
}

func (p *MockRefundProvider) Name() string { return ProviderMock }

func (p *MockRefundProvider) ensureAllowed() error {
	if p.appEnv == "production" || !p.enabled {
		return ErrRefundConfigMissing
	}
	return nil
}

func (p *MockRefundProvider) CreateRefund(ctx context.Context, request RefundProviderRequest) (RefundProviderResponse, error) {
	if err := p.ensureAllowed(); err != nil {
		return RefundProviderResponse{}, err
	}
	raw, _ := json.Marshal(map[string]any{"refundNo": request.RefundNo, "amount": request.Amount, "status": StatusProcessing})
	return RefundProviderResponse{ProviderRefundID: "MOCK_REFUND_" + request.RefundNo, Status: StatusProcessing, Raw: raw}, nil
}

func (p *MockRefundProvider) QueryRefund(ctx context.Context, model *Refund) (RefundNotification, error) {
	if err := p.ensureAllowed(); err != nil {
		return RefundNotification{}, err
	}
	status := model.Status
	if status == StatusProcessing || status == StatusPending {
		status = StatusProcessing
	}
	return RefundNotification{EventID: "mock-query-" + model.RefundNo, MerchantRefundNo: model.RefundNo, ProviderRefundID: strValue(model.ProviderRefundID), Status: status, Amount: model.Amount, Currency: model.Currency, PayloadHash: hashPayload([]byte(model.RefundNo))}, nil
}

func (p *MockRefundProvider) VerifyRefundNotification(ctx context.Context, headers map[string]string, body []byte) (RefundNotification, error) {
	if err := p.ensureAllowed(); err != nil {
		return RefundNotification{}, err
	}
	if p.secret != "" {
		expected := signMock(body, p.secret)
		if headers["X-Mock-Refund-Signature"] != expected {
			return RefundNotification{}, ErrRefundSignatureInvalid
		}
	}
	var payload struct {
		EventID          string `json:"eventId"`
		RefundNo         string `json:"refundNo"`
		ProviderRefundID string `json:"providerRefundId"`
		Status           string `json:"status"`
		Amount           uint64 `json:"amount"`
		Currency         string `json:"currency"`
		SuccessAt        string `json:"successAt"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return RefundNotification{}, ErrRefundNotificationInvalid
	}
	if payload.RefundNo == "" {
		return RefundNotification{}, ErrRefundNotificationInvalid
	}
	if payload.Status == "" {
		payload.Status = StatusSuccess
	}
	if payload.Currency == "" {
		payload.Currency = CurrencyCNY
	}
	successAt := time.Now()
	if payload.SuccessAt != "" {
		if parsed, err := time.Parse(time.RFC3339, payload.SuccessAt); err == nil {
			successAt = parsed
		}
	}
	return RefundNotification{EventID: payload.EventID, MerchantRefundNo: payload.RefundNo, ProviderRefundID: payload.ProviderRefundID, Status: payload.Status, Amount: payload.Amount, Currency: payload.Currency, SuccessAt: successAt, PayloadHash: hashPayload(body), RawPayload: body}, nil
}

func signMock(body []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}
