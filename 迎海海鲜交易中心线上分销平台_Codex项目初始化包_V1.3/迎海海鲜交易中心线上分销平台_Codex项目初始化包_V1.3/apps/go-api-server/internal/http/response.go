package http

import (
	nethttp "net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code string `json:"code"`
	Message string `json:"message"`
	Data any `json:"data,omitempty"`
	RequestID string `json:"requestId,omitempty"`
}

func OK(c *gin.Context, data any) {
	c.JSON(nethttp.StatusOK, Response{
		Code: "OK",
		Message: "success",
		Data: data,
		RequestID: requestID(c),
	})
}

func Fail(c *gin.Context, status int, code string, message string) {
	c.JSON(status, Response{
		Code: code,
		Message: message,
		RequestID: requestID(c),
	})
}

func requestID(c *gin.Context) string {
	value, exists := c.Get("requestId")
	if !exists {
		return ""
	}
	requestID, _ := value.(string)
	return requestID
}
