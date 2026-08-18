package cart

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
	cfg config.Config
}

func NewHandler(service *Service, cfg config.Config) *Handler {
	return &Handler{service: service, cfg: cfg}
}

func (h *Handler) RegisterAppRoutes(group *gin.RouterGroup) {
	cart := group.Group("/cart")
	cart.Use(middleware.JWTAuth(h.cfg))
	cart.GET("", h.GetCart)
	cart.POST("/items", h.AddItem)
	cart.PATCH("/items/:id", h.UpdateQuantity)
	cart.PATCH("/items/:id/selected", h.UpdateSelected)
	cart.PATCH("/selection", h.UpdateSelection)
	cart.DELETE("/items/:id", h.RemoveItem)
	cart.DELETE("/unavailable-items", h.RemoveUnavailableItems)
}

func (h *Handler) GetCart(c *gin.Context) {
	dto, err := h.service.GetCart(c.GetString("userId"))
	if err != nil { fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error()); return }
	ok(c, dto)
}

func (h *Handler) AddItem(c *gin.Context) {
	var input AddItemInput
	if err := c.ShouldBindJSON(&input); err != nil { fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body"); return }
	if err := h.service.AddItem(c.GetString("userId"), input); err != nil { writeCartError(c, err); return }
	ok(c, gin.H{"added": true})
}

func (h *Handler) UpdateQuantity(c *gin.Context) {
	id, valid := parseID(c.Param("id"))
	if !valid { fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid cart item id"); return }
	var input QuantityInput
	if err := c.ShouldBindJSON(&input); err != nil { fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body"); return }
	if err := h.service.UpdateQuantity(c.GetString("userId"), id, input); err != nil { writeCartError(c, err); return }
	ok(c, gin.H{"updated": true})
}

func (h *Handler) UpdateSelected(c *gin.Context) {
	id, valid := parseID(c.Param("id"))
	if !valid { fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid cart item id"); return }
	var input SelectedInput
	if err := c.ShouldBindJSON(&input); err != nil { fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body"); return }
	if err := h.service.UpdateSelected(c.GetString("userId"), id, input.Selected); err != nil { writeCartError(c, err); return }
	ok(c, gin.H{"updated": true})
}

func (h *Handler) UpdateSelection(c *gin.Context) {
	var input SelectionInput
	if err := c.ShouldBindJSON(&input); err != nil { fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body"); return }
	if err := h.service.UpdateSelection(c.GetString("userId"), input); err != nil { writeCartError(c, err); return }
	ok(c, gin.H{"updated": true})
}

func (h *Handler) RemoveItem(c *gin.Context) {
	id, valid := parseID(c.Param("id"))
	if !valid { fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid cart item id"); return }
	if err := h.service.RemoveItem(c.GetString("userId"), id); err != nil { writeCartError(c, err); return }
	ok(c, gin.H{"deleted": true})
}

func (h *Handler) RemoveUnavailableItems(c *gin.Context) {
	if err := h.service.RemoveUnavailableItems(c.GetString("userId")); err != nil { writeCartError(c, err); return }
	ok(c, gin.H{"deleted": true})
}

func parseID(raw string) (uint64, bool) {
	id, err := strconv.ParseUint(raw, 10, 64)
	return id, err == nil && id > 0
}

func writeCartError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrCartItemNotFound):
		fail(c, http.StatusNotFound, "CART_ITEM_NOT_FOUND", "cart item not found")
	case errors.Is(err, ErrQuantityInvalid):
		fail(c, http.StatusBadRequest, "CART_QUANTITY_INVALID", "cart quantity invalid")
	case errors.Is(err, ErrQuantityLimit):
		fail(c, http.StatusBadRequest, "CART_QUANTITY_LIMIT_EXCEEDED", "cart quantity limit exceeded")
	case errors.Is(err, ErrCartItemUnavailable):
		fail(c, http.StatusBadRequest, "CART_ITEM_UNAVAILABLE", "cart item unavailable")
	case errors.Is(err, ErrProductOffShelf):
		fail(c, http.StatusBadRequest, "PRODUCT_OFF_SHELF", "product off shelf")
	case errors.Is(err, ErrSKUNotFound):
		fail(c, http.StatusNotFound, "SKU_NOT_FOUND", "sku not found")
	case errors.Is(err, ErrSKUDisabled):
		fail(c, http.StatusBadRequest, "SKU_DISABLED", "sku disabled")
	case errors.Is(err, ErrInsufficientStock):
		fail(c, http.StatusBadRequest, "INSUFFICIENT_STOCK", "insufficient stock")
	default:
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
}

func ok(c *gin.Context, data any) { c.JSON(http.StatusOK, gin.H{"code": "OK", "message": "success", "data": data, "requestId": c.GetString("requestId")}) }
func fail(c *gin.Context, status int, code string, message string) { c.JSON(status, gin.H{"code": code, "message": message, "requestId": c.GetString("requestId")}) }
