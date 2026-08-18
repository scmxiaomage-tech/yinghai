package refund

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
	refunds := group.Group("/refunds")
	refunds.Use(middleware.JWTAuth(h.cfg))
	refunds.GET("/:id", h.UserDetail)

	orders := group.Group("/orders")
	orders.Use(middleware.JWTAuth(h.cfg))
	orders.GET("/:id/refund", h.UserOrderRefund)
}

func (h *Handler) RegisterPublicRoutes(group *gin.RouterGroup) {
	group.POST("/refunds/wechat/notify", h.WechatNotify)
	group.POST("/refunds/mock/notify", h.MockNotify)
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	refunds := group.Group("/refunds")
	refunds.Use(middleware.JWTAuth(h.cfg))
	refunds.GET("", h.AdminList)
	refunds.GET("/:id", h.AdminDetail)

	orders := group.Group("/orders")
	orders.Use(middleware.JWTAuth(h.cfg))
	orders.POST("/:id/refund", h.AdminCreate)
}

func (h *Handler) UserDetail(c *gin.Context) {
	id, valid := parseUintID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid refund id")
		return
	}
	dto, err := h.service.GetUserRefund(c.GetString("userId"), id)
	if err != nil {
		writeRefundError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) UserOrderRefund(c *gin.Context) {
	id, valid := parseUintID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	dto, err := h.service.GetUserOrderRefund(c.GetString("userId"), id)
	if err != nil {
		writeRefundError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) AdminCreate(c *gin.Context) {
	id, valid := parseUintID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	var input CreateRefundInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	operatorID := c.GetString("userId")
	if operatorID == "" {
		operatorID = "admin"
	}
	dto, err := h.service.CreateAdminRefund(c.Request.Context(), id, operatorID, input)
	if err != nil {
		writeRefundError(c, err)
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
		writeRefundError(c, err)
		return
	}
	ok(c, gin.H{"received": true})
}

func (h *Handler) AdminList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	result, err := h.service.ListAdminRefunds(RefundQuery{RefundNo: c.Query("refundNo"), OrderNo: c.Query("orderNo"), PaymentNo: c.Query("paymentNo"), UserID: c.Query("userId"), Provider: c.Query("provider"), Status: c.Query("status"), StartAt: c.Query("startAt"), EndAt: c.Query("endAt"), Page: page, PageSize: pageSize})
	if err != nil {
		writeRefundError(c, err)
		return
	}
	ok(c, result)
}

func (h *Handler) AdminDetail(c *gin.Context) {
	id, valid := parseUintID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid refund id")
		return
	}
	dto, err := h.service.GetAdminRefund(id)
	if err != nil {
		writeRefundError(c, err)
		return
	}
	ok(c, dto)
}

func parseUintID(raw string) (uint64, bool) {
	id, err := strconv.ParseUint(raw, 10, 64)
	return id, err == nil && id > 0
}

func writeRefundError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrRefundNotFound):
		fail(c, http.StatusNotFound, "REFUND_NOT_FOUND", "refund not found")
	case errors.Is(err, ErrRefundAlreadyExists):
		fail(c, http.StatusConflict, "REFUND_ALREADY_EXISTS", "refund already exists")
	case errors.Is(err, ErrRefundNotAllowed):
		fail(c, http.StatusConflict, "REFUND_NOT_ALLOWED", "refund not allowed")
	case errors.Is(err, ErrRefundAmountMismatch):
		fail(c, http.StatusConflict, "REFUND_AMOUNT_MISMATCH", "refund amount mismatch")
	case errors.Is(err, ErrRefundProviderError):
		fail(c, http.StatusBadGateway, "REFUND_PROVIDER_ERROR", "refund provider error")
	case errors.Is(err, ErrRefundAlreadySuccess):
		fail(c, http.StatusConflict, "REFUND_ALREADY_SUCCESS", "refund already success")
	case errors.Is(err, ErrRefundInvalidState):
		fail(c, http.StatusConflict, "REFUND_INVALID_STATE", "refund invalid state")
	case errors.Is(err, ErrRefundNotificationInvalid):
		fail(c, http.StatusBadRequest, "REFUND_NOTIFICATION_INVALID", "refund notification invalid")
	case errors.Is(err, ErrRefundSignatureInvalid):
		fail(c, http.StatusUnauthorized, "REFUND_SIGNATURE_INVALID", "refund signature invalid")
	case errors.Is(err, ErrRefundConfigMissing):
		fail(c, http.StatusServiceUnavailable, "REFUND_CONFIG_MISSING", "refund runtime config missing")
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
