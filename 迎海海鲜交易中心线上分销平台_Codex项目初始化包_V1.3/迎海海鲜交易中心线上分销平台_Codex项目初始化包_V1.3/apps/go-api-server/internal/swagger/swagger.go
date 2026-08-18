package swagger

import (
	"net/http"

	"yinghai/go-api-server/internal/config"

	"github.com/gin-gonic/gin"
)

func Register(router *gin.Engine, cfg config.Config) {
	router.GET("/swagger/doc.json", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"openapi": "3.0.3",
			"info": gin.H{
				"title":       "迎海海鲜交易中心 API V2",
				"version":     "R7",
				"description": "Go + Gin + GORM + MySQL API V2. R7 includes user/auth, product, inventory, cart, order, payment and whole-order refund center endpoints.",
			},
			"servers": []gin.H{{"url": cfg.APIPrefix}},
			"paths": gin.H{
				"/health":                method("get", "Health check", false),
				"/app/auth/wechat-login": method("post", "微信登录", false),
				"/app/auth/me":           method("get", "当前用户", true),
				"/app/auth/logout":       method("post", "登出", true),
				"/app/user/profile": gin.H{
					"get": operation("获取用户资料", true),
					"put": operation("更新用户资料", true),
				},
				"/app/user/addresses": gin.H{
					"get":  operation("地址列表", true),
					"post": operation("新增地址", true),
				},
				"/app/user/addresses/{id}": gin.H{
					"put":    operation("更新地址", true),
					"delete": operation("删除地址", true),
				},
				"/app/user/addresses/{id}/default": method("put", "设置默认地址", true),
				"/app/categories":                  method("get", "用户端分类列表", false),
				"/app/products":                    method("get", "用户端商品列表，Query: categoryId, keyword, page, pageSize, sort", false),
				"/app/products/recommended":        method("get", "用户端推荐商品", false),
				"/app/products/{id}":               method("get", "用户端商品详情，禁止返回 costPrice", false),
				"/app/cart":                        method("get", "获取当前用户购物车，返回实时商品/SKU/库存状态", true),
				"/app/cart/items":                  method("post", "加入购物车；同 SKU upsert 增加数量；不锁库存", true),
				"/app/cart/items/{id}": gin.H{
					"patch":  operation("修改购物车项数量；数量 1-999；库存不足拒绝", true),
					"delete": operation("删除购物车项；按当前用户隔离", true),
				},
				"/app/cart/items/{id}/selected": method("patch", "修改单项选中状态", true),
				"/app/cart/selection":           method("patch", "批量选择；无 itemIds 时表示全选/取消全选", true),
				"/app/cart/unavailable-items":   method("delete", "清理永久失效购物车项；不清理库存不足项", true),
				"/app/orders/preview":           method("post", "订单确认预览；不创建订单、不锁库存", true),
				"/app/orders": gin.H{
					"post": operation("创建订单；服务端重算金额；事务内创建订单与锁库存", true),
					"get":  operation("当前用户订单列表", true),
				},
				"/app/orders/{id}":                method("get", "当前用户订单详情；用户隔离", true),
				"/app/orders/{id}/cancel":         method("post", "取消待支付订单；R6 后需协调 payment close", true),
				"/app/orders/{id}/payments":       method("post", "创建支付单；amount 只来自 orders.payable_amount", true),
				"/app/orders/{id}/payment-status": method("get", "查询服务端支付结果；必要时主动查单", true),
				"/app/refunds/{id}":               method("get", "用户端查询退款单，仅限本人", true),
				"/app/orders/{id}/refund":         method("get", "用户端查询订单退款状态，不开放用户创建退款", true),
				"/payments/wechat/notify":         method("post", "微信支付服务器回调；Provider 验签；不要 JWT", false),
				"/payments/mock/notify":           method("post", "dev/test Mock 支付回调；生产禁止", false),
				"/refunds/wechat/notify":          method("post", "微信退款回调；Provider 验签；不要 JWT", false),
				"/refunds/mock/notify":            method("post", "dev/test Mock 退款回调；生产禁止", false),
				"/admin/categories": gin.H{
					"get":  operation("后台分类列表，需要 category_read", true),
					"post": operation("创建分类，需要 category_write", true),
				},
				"/admin/categories/{id}": gin.H{
					"put":    operation("更新分类，需要 category_write", true),
					"delete": operation("删除分类，需要 category_write；有商品保护", true),
				},
				"/admin/products": gin.H{
					"get":  operation("后台商品列表，需要 product_read", true),
					"post": operation("创建商品，需要 product_write", true),
				},
				"/admin/products/{id}": gin.H{
					"get": operation("后台商品详情，需要 product_read", true),
					"put": operation("更新商品，需要 product_write", true),
				},
				"/admin/products/{id}/on-sale":  method("post", "商品上架，需要 product_shelf", true),
				"/admin/products/{id}/off-sale": method("post", "商品下架，需要 product_shelf", true),
				"/admin/products/{id}/skus":     method("post", "创建 SKU，需要 sku_write", true),
				"/admin/skus/{id}": gin.H{
					"put":    operation("更新 SKU，需要 sku_write", true),
					"delete": operation("删除 SKU，需要 sku_write", true),
				},
				"/admin/products/{id}/images":       method("post", "添加商品图片 URL，需要 product_write", true),
				"/admin/product-images/{id}":        method("delete", "删除商品图片，需要 product_write", true),
				"/admin/inventories":                method("get", "库存列表，需要 inventory_read", true),
				"/admin/inventories/{skuId}":        method("get", "SKU 库存详情，需要 inventory_read", true),
				"/admin/inventories/{skuId}/adjust": method("post", "人工库存调整，需要 inventory_write；必须产生流水", true),
				"/admin/inventory-transactions":     method("get", "库存流水列表，需要 inventory_read", true),
				"/admin/orders":                     method("get", "后台订单列表，只读，需要 order_read", true),
				"/admin/orders/{id}":                method("get", "后台订单详情，只读，需要 order_read", true),
				"/admin/payments":                   method("get", "后台支付单列表，R6 只读", true),
				"/admin/payments/{id}":              method("get", "后台支付单详情，包含 payment_events，R6 只读", true),
				"/admin/refunds":                    method("get", "后台退款单列表，R7 只读", true),
				"/admin/refunds/{id}":               method("get", "后台退款单详情，包含 refund_events，R7 只读", true),
				"/admin/orders/{id}/refund":         method("post", "后台对已支付订单发起整单全额退款", true),
			},
			"components": gin.H{
				"securitySchemes": gin.H{
					"bearerAuth": gin.H{
						"type":         "http",
						"scheme":       "bearer",
						"bearerFormat": "JWT",
					},
				},
			},
		})
	})

	router.GET("/swagger/index.html", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(`<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>迎海 API V2 Swagger</title></head>
<body style="font-family:Arial,'Microsoft YaHei',sans-serif;padding:32px;background:#f8fafc;color:#0f172a">
<h1>迎海海鲜交易中心 API V2</h1>
<p>R0 基础架构阶段：Swagger 文档入口已预留。</p>
<p><a href="/swagger/doc.json">查看 OpenAPI JSON</a></p>
</body>
</html>`))
	})
}

func method(method string, summary string, auth bool) gin.H {
	return gin.H{method: operation(summary, auth)}
}

func operation(summary string, auth bool) gin.H {
	op := gin.H{
		"summary": summary,
		"responses": gin.H{
			"200": gin.H{"description": "success"},
			"400": gin.H{"description": "bad request"},
			"401": gin.H{"description": "unauthorized"},
			"500": gin.H{"description": "internal error"},
		},
	}
	if auth {
		op["security"] = []gin.H{{"bearerAuth": []string{}}}
	}
	return op
}
