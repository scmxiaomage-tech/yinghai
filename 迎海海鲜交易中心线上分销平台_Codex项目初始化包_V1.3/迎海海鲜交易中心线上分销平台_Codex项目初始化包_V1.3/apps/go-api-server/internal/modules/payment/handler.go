package payment

import (
	"errors"
	"io"
	"net/http"
	"strconv"

	"yinghai/go-api-server/internal/config"
	"yinghai/go-api-server/internal/middleware"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
	cfg     config.Config
}

func NewHandler(service *Service, cfg config.Config) *Handler {
	return &Handler{service: service, cfg: cfg}
}

func (h *Handler) RegisterAppRoutes(group *gin.RouterGroup) {
	orders := group.Group("/orders")
	orders.Use(middleware.JWTAuth(h.cfg))
	orders.POST("/:id/payments", h.CreatePayment)
	orders.GET("/:id/payment-status", h.PaymentStatus)
}

func (h *Handler) RegisterPublicRoutes(group *gin.RouterGroup) {
	group.POST("/payments/wechat/notify", h.WechatNotify)
	group.POST("/payments/mock/notify", h.MockNotify)
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	payments := group.Group("/payments")
	payments.Use(middleware.JWTAuth(h.cfg))
	payments.GET("", h.AdminList)
	payments.GET("/:id", h.AdminDetail)
}

func (h *Handler) CreatePayment(c *gin.Context) {
	id, valid := parseUintID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	var input CreatePaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	dto, err := h.service.CreatePayment(c.Request.Context(), c.GetString("userId"), id, input)
	if err != nil {
		writePaymentError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) PaymentStatus(c *gin.Context) {
	id, valid := parseUintID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	dto, err := h.service.GetPaymentStatus(c.Request.Context(), c.GetString("userId"), id)
	if err != nil {
		writePaymentError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) WechatNotify(c *gin.Context) {
	h.providerNotify(c, ProviderWechatPay)
}

func (h *Handler) MockNotify(c *gin.Context) {
	h.providerNotify(c, ProviderMock)
}

func (h *Handler) providerNotify(c *gin.Context, provider string) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid notify body")
		return
	}
	headers := map[string]string{}
	for key, values := range c.Request.Header {
		if len(values) > 0 {
			headers[key] = values[0]
		}
	}
	if err := h.service.HandleProviderNotification(c.Request.Context(), provider, headers, body); err != nil {
		writePaymentError(c, err)
		return
	}
	ok(c, gin.H{"received": true})
}

func (h *Handler) AdminList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	result, err := h.service.ListAdminPayments(PaymentQuery{PaymentNo: c.Query("paymentNo"), OrderNo: c.Query("orderNo"), ProviderTradeNo: c.Query("providerTradeNo"), UserID: c.Query("userId"), Provider: c.Query("provider"), Status: c.Query("status"), StartAt: c.Query("startAt"), EndAt: c.Query("endAt"), Page: page, PageSize: pageSize})
	if err != nil {
		writePaymentError(c, err)
		return
	}
	ok(c, result)
}

func (h *Handler) AdminDetail(c *gin.Context) {
	id, valid := parseUintID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid payment id")
		return
	}
	dto, err := h.service.GetAdminPayment(id)
	if err != nil {
		writePaymentError(c, err)
		return
	}
	ok(c, dto)
}

func parseUintID(raw string) (uint64, bool) {
	id, err := strconv.ParseUint(raw, 10, 64)
	return id, err == nil && id > 0
}

func writePaymentError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrPaymentNotFound):
		fail(c, http.StatusNotFound, "PAYMENT_NOT_FOUND", "payment not found")
	case errors.Is(err, ErrPaymentAlreadySuccess):
		fail(c, http.StatusConflict, "PAYMENT_ALREADY_SUCCESS", "payment already success")
	case errors.Is(err, ErrPaymentAlreadyClosed):
		fail(c, http.StatusConflict, "PAYMENT_ALREADY_CLOSED", "payment already closed")
	case errors.Is(err, ErrPaymentCreateFailed):
		fail(c, http.StatusBadRequest, "PAYMENT_CREATE_FAILED", "payment create failed")
	case errors.Is(err, ErrPaymentProviderError):
		fail(c, http.StatusBadGateway, "PAYMENT_PROVIDER_ERROR", "payment provider error")
	case errors.Is(err, ErrPaymentQueryFailed):
		fail(c, http.StatusBadGateway, "PAYMENT_QUERY_FAILED", "payment query failed")
	case errors.Is(err, ErrPaymentCloseFailed):
		fail(c, http.StatusBadGateway, "PAYMENT_CLOSE_FAILED", "payment close failed")
	case errors.Is(err, ErrPaymentSignatureInvalid):
		fail(c, http.StatusUnauthorized, "PAYMENT_SIGNATURE_INVALID", "payment signature invalid")
	case errors.Is(err, ErrPaymentNotificationInvalid):
		fail(c, http.StatusBadRequest, "PAYMENT_NOTIFICATION_INVALID", "payment notification invalid")
	case errors.Is(err, ErrPaymentAmountMismatch):
		fail(c, http.StatusConflict, "PAYMENT_AMOUNT_MISMATCH", "payment amount mismatch")
	case errors.Is(err, ErrPaymentOrderInvalidStatus):
		fail(c, http.StatusConflict, "PAYMENT_ORDER_INVALID_STATUS", "payment order invalid status")
	case errors.Is(err, ErrPaymentOrderExpired):
		fail(c, http.StatusConflict, "PAYMENT_ORDER_EXPIRED", "payment order expired")
	case errors.Is(err, ErrPaymentDuplicateRequest):
		fail(c, http.StatusConflict, "PAYMENT_DUPLICATE_REQUEST", "duplicate payment request")
	case errors.Is(err, ErrPaymentConfigMissing):
		fail(c, http.StatusServiceUnavailable, "PAYMENT_CONFIG_MISSING", "payment runtime config missing")
	default:
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
}

func ok(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"code": "OK", "message": "success", "data": data, "requestId": c.GetString("requestId")})
}
func fail(c *gin.Context, status int, code string, message string) {
	c.JSON(status, gin.H{"code": code, "message": message, "requestId": c.GetString("requestId")})
}
