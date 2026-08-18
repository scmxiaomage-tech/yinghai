package http

import (
	"net/http"

	"yinghai/go-api-server/internal/config"
	"yinghai/go-api-server/internal/logger"
	"yinghai/go-api-server/internal/middleware"
	authmodule "yinghai/go-api-server/internal/modules/auth"
	cartmodule "yinghai/go-api-server/internal/modules/cart"
	inventorymodule "yinghai/go-api-server/internal/modules/inventory"
	ordermodule "yinghai/go-api-server/internal/modules/order"
	paymentmodule "yinghai/go-api-server/internal/modules/payment"
	productmodule "yinghai/go-api-server/internal/modules/product"
	refundmodule "yinghai/go-api-server/internal/modules/refund"
	usermodule "yinghai/go-api-server/internal/modules/user"
	"yinghai/go-api-server/internal/swagger"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type RouterDeps struct {
	Config config.Config
	Logger *logger.Logger
	DB     *gorm.DB
	Redis  *redis.Client
}

func NewRouter(deps RouterDeps) *gin.Engine {
	if deps.Config.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(middleware.RequestID())
	router.Use(middleware.AccessLog(deps.Logger))
	router.Use(middleware.Recovery(deps.Logger))
	router.Use(middleware.CORS())

	api := router.Group(deps.Config.APIPrefix)
	api.GET("/health", func(c *gin.Context) {
		sqlDB, err := deps.DB.DB()
		if err != nil {
			Fail(c, http.StatusServiceUnavailable, "MYSQL_UNAVAILABLE", "mysql handle unavailable")
			return
		}
		if err := sqlDB.Ping(); err != nil {
			Fail(c, http.StatusServiceUnavailable, "MYSQL_UNAVAILABLE", "mysql ping failed")
			return
		}
		if err := deps.Redis.Ping(c.Request.Context()).Err(); err != nil {
			Fail(c, http.StatusServiceUnavailable, "REDIS_UNAVAILABLE", "redis ping failed")
			return
		}
		OK(c, gin.H{
			"status":     "UP",
			"service":    deps.Config.AppName,
			"apiVersion": "v2",
			"mysql":      "UP",
			"redis":      "UP",
		})
	})

	userRepo := usermodule.NewRepository(deps.DB)
	userService := usermodule.NewService(userRepo)
	authService := authmodule.NewService(deps.Config, userRepo)
	productRepo := productmodule.NewRepository(deps.DB)
	productService := productmodule.NewService(productRepo)
	productHandler := productmodule.NewHandler(productService, deps.Config)
	inventoryRepo := inventorymodule.NewRepository(deps.DB)
	inventoryService := inventorymodule.NewService(inventoryRepo)
	inventoryHandler := inventorymodule.NewHandler(inventoryService, deps.Config)
	cartRepo := cartmodule.NewRepository(deps.DB)
	cartService := cartmodule.NewService(cartRepo)
	cartHandler := cartmodule.NewHandler(cartService, deps.Config)
	orderRepo := ordermodule.NewRepository(deps.DB)
	orderService := ordermodule.NewService(orderRepo, inventoryService, deps.Config)
	orderHandler := ordermodule.NewHandler(orderService, deps.Config)
	paymentRepo := paymentmodule.NewRepository(deps.DB)
	paymentProviders := paymentmodule.NewProviderRegistry(
		paymentmodule.NewWechatPayProvider(deps.Config),
		paymentmodule.NewMockPaymentProvider(deps.Config.MockPaymentEnabled, deps.Config.MockPaymentSecret, deps.Config.AppEnv),
	)
	paymentService := paymentmodule.NewService(paymentRepo, inventoryService, paymentProviders, deps.Config)
	paymentHandler := paymentmodule.NewHandler(paymentService, deps.Config)
	refundRepo := refundmodule.NewRepository(deps.DB)
	refundProviders := refundmodule.NewProviderRegistry(
		refundmodule.NewWechatRefundProvider(deps.Config),
		refundmodule.NewMockRefundProvider(deps.Config.MockPaymentEnabled, deps.Config.MockPaymentSecret, deps.Config.AppEnv),
	)
	refundService := refundmodule.NewService(refundRepo, inventoryService, refundProviders, deps.Config)
	refundHandler := refundmodule.NewHandler(refundService, deps.Config)
	app := api.Group("/app")
	authmodule.NewHandler(authService, userService, deps.Config).RegisterRoutes(app)
	usermodule.NewHandler(userService, deps.Config).RegisterRoutes(app)
	productHandler.RegisterAppRoutes(app)
	cartHandler.RegisterAppRoutes(app)
	orderHandler.RegisterAppRoutes(app)
	paymentHandler.RegisterAppRoutes(app)
	refundHandler.RegisterAppRoutes(app)
	paymentHandler.RegisterPublicRoutes(api)
	refundHandler.RegisterPublicRoutes(api)

	admin := api.Group("/admin")
	productHandler.RegisterAdminRoutes(admin)
	inventoryHandler.RegisterAdminRoutes(admin)
	orderHandler.RegisterAdminRoutes(admin)
	paymentHandler.RegisterAdminRoutes(admin)
	refundHandler.RegisterAdminRoutes(admin)

	swagger.Register(router, deps.Config)
	return router
}
