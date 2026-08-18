package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"yinghai/go-api-server/internal/config"
	"yinghai/go-api-server/internal/database"
	apihttp "yinghai/go-api-server/internal/http"
	"yinghai/go-api-server/internal/logger"
	redisclient "yinghai/go-api-server/internal/redis"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg)
	defer func() { _ = log.Sync() }()

	db, err := database.Connect(cfg, log)
	if err != nil {
		log.Fatal("mysql connection failed", logger.Error(err))
	}

	redisClient, err := redisclient.Connect(context.Background(), cfg, log)
	if err != nil {
		log.Fatal("redis connection failed", logger.Error(err))
	}

	router := apihttp.NewRouter(apihttp.RouterDeps{
		Config: cfg,
		Logger: log,
		DB: db,
		Redis: redisClient,
	})

	server := &http.Server{
		Addr:              fmt.Sprintf(":%s", cfg.AppPort),
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Info("yinghai go api server started", logger.String("addr", server.Addr), logger.String("apiPrefix", cfg.APIPrefix))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("server stopped unexpectedly", logger.Error(err))
	}
}
