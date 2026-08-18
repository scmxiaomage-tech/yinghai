package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppName   string
	AppEnv    string
	AppPort   string
	APIPrefix string

	MySQLHost      string
	MySQLPort      string
	MySQLDatabase  string
	MySQLUser      string
	MySQLPassword  string
	MySQLCharset   string
	MySQLParseTime string
	MySQLLoc       string

	RedisAddr     string
	RedisPassword string
	RedisDB       int

	JWTSecret          string
	JWTIssuer          string
	JWTExpiresMinutes  int
	OrderExpireMinutes int

	WechatAppID             string
	WechatAppSecret         string
	WechatLoginMock         bool
	WechatPayAppID          string
	WechatPayMchID          string
	WechatPayAPIv3Key       string
	WechatPayCertSerial     string
	WechatPayPrivateKeyPath string
	WechatPayNotifyURL      string
	WechatRefundNotifyURL   string
	MockPaymentEnabled      bool
	MockPaymentSecret       string

	LogLevel string
}

func Load() Config {
	_ = godotenv.Load()

	return Config{
		AppName:   env("APP_NAME", "yinghai-go-api-server"),
		AppEnv:    env("APP_ENV", "development"),
		AppPort:   env("APP_PORT", "8081"),
		APIPrefix: env("API_PREFIX", "/api/v2"),

		MySQLHost:      env("MYSQL_HOST", "127.0.0.1"),
		MySQLPort:      env("MYSQL_PORT", "3306"),
		MySQLDatabase:  env("MYSQL_DATABASE", "yinghai_v2_dev"),
		MySQLUser:      env("MYSQL_USER", "yinghai"),
		MySQLPassword:  env("MYSQL_PASSWORD", "yinghai_dev_password"),
		MySQLCharset:   env("MYSQL_CHARSET", "utf8mb4"),
		MySQLParseTime: env("MYSQL_PARSE_TIME", "true"),
		MySQLLoc:       env("MYSQL_LOC", "Local"),

		RedisAddr:     env("REDIS_ADDR", "127.0.0.1:6379"),
		RedisPassword: env("REDIS_PASSWORD", "yinghai_redis_password"),
		RedisDB:       envInt("REDIS_DB", 0),

		JWTSecret:          env("JWT_SECRET", "change_me_for_local_dev"),
		JWTIssuer:          env("JWT_ISSUER", "yinghai-v2"),
		JWTExpiresMinutes:  envInt("JWT_EXPIRES_MINUTES", 120),
		OrderExpireMinutes: envInt("ORDER_EXPIRE_MINUTES", 30),

		WechatAppID:             env("WECHAT_APP_ID", ""),
		WechatAppSecret:         env("WECHAT_APP_SECRET", ""),
		WechatLoginMock:         envBool("WECHAT_LOGIN_MOCK", true),
		WechatPayAppID:          env("WECHAT_PAY_APP_ID", ""),
		WechatPayMchID:          env("WECHAT_PAY_MCH_ID", ""),
		WechatPayAPIv3Key:       env("WECHAT_PAY_API_V3_KEY", ""),
		WechatPayCertSerial:     env("WECHAT_PAY_CERT_SERIAL", ""),
		WechatPayPrivateKeyPath: env("WECHAT_PAY_PRIVATE_KEY_PATH", ""),
		WechatPayNotifyURL:      env("WECHAT_PAY_NOTIFY_URL", ""),
		WechatRefundNotifyURL:   env("WECHAT_REFUND_NOTIFY_URL", ""),
		MockPaymentEnabled:      envBool("MOCK_PAYMENT_ENABLED", true),
		MockPaymentSecret:       env("MOCK_PAYMENT_SECRET", "change_me_mock_payment_secret"),

		LogLevel: env("LOG_LEVEL", "debug"),
	}
}

func (c Config) MySQLDSN() string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=%s&loc=%s",
		c.MySQLUser,
		c.MySQLPassword,
		c.MySQLHost,
		c.MySQLPort,
		c.MySQLDatabase,
		c.MySQLCharset,
		c.MySQLParseTime,
		c.MySQLLoc,
	)
}

func env(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func envInt(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}

func envBool(key string, fallback bool) bool {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	value, err := strconv.ParseBool(raw)
	if err != nil {
		return fallback
	}
	return value
}
