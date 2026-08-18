package middleware

import (
	"net/http"
	"strings"

	"yinghai/go-api-server/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	UserID string `json:"userId"`
	Role string `json:"role,omitempty"`
	jwt.RegisteredClaims
}

func JWTAuth(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			abortUnauthorized(c, "missing bearer token")
			return
		}

		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (any, error) {
			return []byte(cfg.JWTSecret), nil
		}, jwt.WithIssuer(cfg.JWTIssuer))
		if err != nil || !token.Valid {
			abortUnauthorized(c, "invalid token")
			return
		}

		claims, ok := token.Claims.(*JWTClaims)
		if !ok {
			abortUnauthorized(c, "invalid claims")
			return
		}
		c.Set("userId", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func abortUnauthorized(c *gin.Context, message string) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"code": "UNAUTHORIZED",
		"message": message,
		"requestId": c.GetString("requestId"),
	})
}
