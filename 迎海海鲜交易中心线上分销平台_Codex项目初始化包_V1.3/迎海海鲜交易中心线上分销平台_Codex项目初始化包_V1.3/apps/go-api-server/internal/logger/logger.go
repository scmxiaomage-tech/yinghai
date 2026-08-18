package logger

import (
	"yinghai/go-api-server/internal/config"

	"go.uber.org/zap"
)

type Logger = zap.Logger
type Field = zap.Field

func New(cfg config.Config) *zap.Logger {
	if cfg.AppEnv == "production" {
		log, _ := zap.NewProduction()
		return log
	}
	log, _ := zap.NewDevelopment()
	return log
}

func String(key string, value string) Field {
	return zap.String(key, value)
}

func Error(err error) Field {
	return zap.Error(err)
}
