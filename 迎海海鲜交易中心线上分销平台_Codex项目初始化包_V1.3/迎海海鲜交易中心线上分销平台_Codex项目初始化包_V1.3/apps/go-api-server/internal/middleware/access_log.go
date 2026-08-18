package middleware

import (
	"time"

	"yinghai/go-api-server/internal/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func AccessLog(log *logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		log.Info("http request",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("latency", time.Since(start)),
			zap.String("requestId", c.GetString("requestId")),
		)
	}
}
