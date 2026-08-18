package order

import (
	"errors"
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
	orders.POST("/preview", h.Preview)
	orders.POST("", h.Create)
	orders.GET("", h.List)
	orders.GET("/:id", h.Detail)
	orders.POST("/:id/cancel", h.Cancel)
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	orders := group.Group("/orders")
	orders.Use(middleware.JWTAuth(h.cfg))
	orders.GET("", h.AdminList)
	orders.GET("/:id", h.AdminDetail)
}

func (h *Handler) Preview(c *gin.Context) {
	var input PreviewOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	dto, err := h.service.Preview(input)
	if err != nil {
		writeOrderError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) Create(c *gin.Context) {
	var input CreateOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	dto, err := h.service.Create(c.GetString("userId"), input)
	if err != nil {
		writeOrderError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) List(c *gin.Context) {
	result, err := h.service.ListUserOrders(c.GetString("userId"), parseQuery(c))
	if err != nil {
		writeOrderError(c, err)
		return
	}
	ok(c, result)
}

func (h *Handler) Detail(c *gin.Context) {
	id, valid := parseID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	dto, err := h.service.GetUserOrder(c.GetString("userId"), id)
	if err != nil {
		writeOrderError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) Cancel(c *gin.Context) {
	id, valid := parseID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	var input CancelOrderInput
	_ = c.ShouldBindJSON(&input)
	dto, err := h.service.Cancel(c.GetString("userId"), id, input.CancelReason)
	if err != nil {
		writeOrderError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) AdminList(c *gin.Context) {
	result, err := h.service.ListAdminOrders(parseQuery(c))
	if err != nil {
		writeOrderError(c, err)
		return
	}
	ok(c, result)
}

func (h *Handler) AdminDetail(c *gin.Context) {
	id, valid := parseID(c.Param("id"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid order id")
		return
	}
	dto, err := h.service.GetAdminOrder(id)
	if err != nil {
		writeOrderError(c, err)
		return
	}
	ok(c, dto)
}

func parseQuery(c *gin.Context) OrderQuery {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	return OrderQuery{Status: c.DefaultQuery("status", "all"), OrderNo: c.Query("orderNo"), Keyword: c.Query("keyword"), Page: page, PageSize: pageSize}
}

func parseID(raw string) (uint64, bool) {
	id, err := strconv.ParseUint(raw, 10, 64)
	return id, err == nil && id > 0
}

func writeOrderError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrOrderNotFound):
		fail(c, http.StatusNotFound, "ORDER_NOT_FOUND", "order not found")
	case errors.Is(err, ErrOrderCreateFailed):
		fail(c, http.StatusBadRequest, "ORDER_CREATE_FAILED", "order create failed")
	case errors.Is(err, ErrOrderInvalidStatus):
		fail(c, http.StatusBadRequest, "ORDER_INVALID_STATUS", "order invalid status")
	case errors.Is(err, ErrOrderAlreadyCancelled):
		fail(c, http.StatusBadRequest, "ORDER_ALREADY_CANCELLED", "order already cancelled")
	case errors.Is(err, ErrOrderAlreadyClosed):
		fail(c, http.StatusBadRequest, "ORDER_ALREADY_CLOSED", "order already closed")
	case errors.Is(err, ErrOrderExpired):
		fail(c, http.StatusBadRequest, "ORDER_EXPIRED", "order expired")
	case errors.Is(err, ErrOrderItemInvalid):
		fail(c, http.StatusBadRequest, "ORDER_ITEM_INVALID", "order item invalid")
	case errors.Is(err, ErrOrderPriceChanged):
		fail(c, http.StatusConflict, "ORDER_PRICE_CHANGED", "order price changed")
	case errors.Is(err, ErrOrderDuplicateRequest):
		fail(c, http.StatusConflict, "ORDER_DUPLICATE_REQUEST", "duplicate order request")
	case errors.Is(err, ErrOrderInsufficientStock):
		fail(c, http.StatusBadRequest, "ORDER_INSUFFICIENT_STOCK", "order insufficient stock")
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
