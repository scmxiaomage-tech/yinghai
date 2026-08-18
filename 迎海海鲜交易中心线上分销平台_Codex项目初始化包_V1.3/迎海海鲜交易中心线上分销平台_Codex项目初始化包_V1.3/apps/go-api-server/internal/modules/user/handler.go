package user

import (
	"net/http"

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

func (h *Handler) RegisterRoutes(group *gin.RouterGroup) {
	userGroup := group.Group("/user")
	userGroup.Use(middleware.JWTAuth(h.cfg))
	userGroup.GET("/profile", h.GetProfile)
	userGroup.PUT("/profile", h.UpdateProfile)
	userGroup.GET("/addresses", h.ListAddresses)
	userGroup.POST("/addresses", h.CreateAddress)
	userGroup.PUT("/addresses/:id", h.UpdateAddress)
	userGroup.DELETE("/addresses/:id", h.DeleteAddress)
	userGroup.PUT("/addresses/:id/default", h.SetDefaultAddress)
}

func (h *Handler) GetProfile(c *gin.Context) {
	profile, err := h.service.Profile(c.GetString("userId"))
	if err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "profile not found")
		return
	}
	ok(c, profile)
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	var input ProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	profile, err := h.service.UpdateProfile(c.GetString("userId"), input)
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, profile)
}

func (h *Handler) ListAddresses(c *gin.Context) {
	list, err := h.service.ListAddresses(c.GetString("userId"))
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, list)
}

func (h *Handler) CreateAddress(c *gin.Context) {
	var input AddressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	address, err := h.service.CreateAddress(c.GetString("userId"), input)
	if err != nil {
		fail(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	ok(c, address)
}

func (h *Handler) UpdateAddress(c *gin.Context) {
	var input AddressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if err := h.service.UpdateAddress(c.GetString("userId"), c.Param("id"), input); err != nil {
		fail(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	ok(c, gin.H{"updated": true})
}

func (h *Handler) DeleteAddress(c *gin.Context) {
	if err := h.service.DeleteAddress(c.GetString("userId"), c.Param("id")); err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, gin.H{"deleted": true})
}

func (h *Handler) SetDefaultAddress(c *gin.Context) {
	if err := h.service.SetDefaultAddress(c.GetString("userId"), c.Param("id")); err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, gin.H{"default": true})
}

func ok(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{
		"code": "OK",
		"message": "success",
		"data": data,
		"requestId": c.GetString("requestId"),
	})
}

func fail(c *gin.Context, status int, code string, message string) {
	c.JSON(status, gin.H{
		"code": code,
		"message": message,
		"requestId": c.GetString("requestId"),
	})
}
