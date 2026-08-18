package middleware

import (
	"net/http"

	"yinghai/go-api-server/internal/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func Recovery(log *logger.Logger) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		log.Error("panic recovered", zap.Any("recovered", recovered), zap.String("requestId", c.GetString("requestId")))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": "INTERNAL_ERROR",
			"message": "internal server error",
			"requestId": c.GetString("requestId"),
		})
	})
}
