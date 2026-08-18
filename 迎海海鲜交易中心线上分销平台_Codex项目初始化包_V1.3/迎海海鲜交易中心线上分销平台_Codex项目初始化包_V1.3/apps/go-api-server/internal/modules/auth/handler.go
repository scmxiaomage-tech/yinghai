package auth

import (
	"net/http"

	"yinghai/go-api-server/internal/config"
	"yinghai/go-api-server/internal/middleware"
	"yinghai/go-api-server/internal/modules/user"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	authService *Service
	userService *user.Service
	cfg config.Config
}

func NewHandler(authService *Service, userService *user.Service, cfg config.Config) *Handler {
	return &Handler{authService: authService, userService: userService, cfg: cfg}
}

func (h *Handler) RegisterRoutes(group *gin.RouterGroup) {
	authGroup := group.Group("/auth")
	authGroup.POST("/wechat-login", h.WechatLogin)

	protected := authGroup.Group("")
	protected.Use(middleware.JWTAuth(h.cfg))
	protected.GET("/me", h.Me)
	protected.POST("/logout", h.Logout)
}

func (h *Handler) WechatLogin(c *gin.Context) {
	var input WechatLoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	input.IP = c.ClientIP()
	input.UserAgent = c.GetHeader("User-Agent")

	result, err := h.authService.WechatLogin(input)
	if err != nil {
		fail(c, http.StatusBadRequest, "WECHAT_LOGIN_FAILED", err.Error())
		return
	}
	ok(c, result)
}

func (h *Handler) Me(c *gin.Context) {
	current, err := h.userService.Me(c.GetString("userId"))
	if err != nil {
		fail(c, http.StatusNotFound, "NOT_FOUND", "user not found")
		return
	}
	ok(c, current)
}

func (h *Handler) Logout(c *gin.Context) {
	ok(c, gin.H{"logout": true})
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
