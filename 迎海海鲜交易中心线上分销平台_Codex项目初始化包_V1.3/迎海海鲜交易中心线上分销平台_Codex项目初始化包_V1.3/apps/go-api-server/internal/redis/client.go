package redis

import (
	"context"

	"yinghai/go-api-server/internal/config"
	"yinghai/go-api-server/internal/logger"

	"github.com/redis/go-redis/v9"
)

func Connect(ctx context.Context, cfg config.Config, log *logger.Logger) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB: cfg.RedisDB,
	})
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	log.Info("redis connected", logger.String("addr", cfg.RedisAddr))
	return client, nil
}
