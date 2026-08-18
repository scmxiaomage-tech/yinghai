package inventory

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

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.Use(middleware.JWTAuth(h.cfg))
	group.GET("/inventories", h.ListInventories)
	group.GET("/inventories/:skuId", h.GetInventory)
	group.POST("/inventories/:skuId/adjust", h.AdjustInventory)
	group.GET("/inventory-transactions", h.ListTransactions)
}

func (h *Handler) ListInventories(c *gin.Context) {
	result, err := h.service.ListInventories(parseInventoryQuery(c))
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, result)
}

func (h *Handler) GetInventory(c *gin.Context) {
	skuID, valid := parseUint(c.Param("skuId"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid sku id")
		return
	}
	dto, err := h.service.GetInventory(skuID)
	if err != nil {
		writeInventoryError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) AdjustInventory(c *gin.Context) {
	skuID, valid := parseUint(c.Param("skuId"))
	if !valid {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid sku id")
		return
	}
	var input AdjustInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	dto, err := h.service.AdjustInventory(skuID, input)
	if err != nil {
		writeInventoryError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) ListTransactions(c *gin.Context) {
	result, err := h.service.ListTransactions(parseTransactionQuery(c))
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, result)
}

func parseInventoryQuery(c *gin.Context) InventoryQuery {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	query := InventoryQuery{Keyword: c.Query("keyword"), StockStatus: c.Query("stockStatus"), LowStock: c.Query("lowStock") == "true", OutOfStock: c.Query("outOfStock") == "true", Page: page, PageSize: pageSize}
	if raw := c.Query("skuId"); raw != "" {
		if id, err := strconv.ParseUint(raw, 10, 64); err == nil {
			query.SKUID = &id
		}
	}
	if raw := c.Query("productId"); raw != "" {
		if id, err := strconv.ParseUint(raw, 10, 64); err == nil {
			query.ProductID = &id
		}
	}
	return query
}

func parseTransactionQuery(c *gin.Context) TransactionQuery {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	query := TransactionQuery{TransactionType: c.Query("transactionType"), StartAt: c.Query("startAt"), EndAt: c.Query("endAt"), Page: page, PageSize: pageSize}
	if raw := c.Query("skuId"); raw != "" {
		if id, err := strconv.ParseUint(raw, 10, 64); err == nil {
			query.SKUID = &id
		}
	}
	if raw := c.Query("productId"); raw != "" {
		if id, err := strconv.ParseUint(raw, 10, 64); err == nil {
			query.ProductID = &id
		}
	}
	return query
}

func parseUint(raw string) (uint64, bool) {
	id, err := strconv.ParseUint(raw, 10, 64)
	return id, err == nil && id > 0
}

func writeInventoryError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrInventoryNotFound):
		fail(c, http.StatusNotFound, "INVENTORY_NOT_FOUND", "inventory not found")
	case errors.Is(err, ErrInsufficientStock):
		fail(c, http.StatusBadRequest, "INSUFFICIENT_STOCK", "insufficient stock")
	case errors.Is(err, ErrInvalidQuantity):
		fail(c, http.StatusBadRequest, "INVALID_INVENTORY_QUANTITY", "invalid quantity")
	case errors.Is(err, ErrInventoryConflict):
		fail(c, http.StatusConflict, "INVENTORY_CONFLICT", "inventory conflict")
	case errors.Is(err, ErrDuplicateOperation):
		fail(c, http.StatusConflict, "DUPLICATE_INVENTORY_OPERATION", "duplicate inventory operation")
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
