# V2 API 璺敱鎬昏〃

## R0 鍩虹 API

| 鏂规硶 | 璺敱 | 璁よ瘉 | 璇存槑 |
|---|---|---|---|
| `GET` | `/api/v2/health` | 鍚?| 鍋ュ悍妫€鏌?|
| `GET` | `/swagger/index.html` | 鍚?| Swagger 椤甸潰 |
| `GET` | `/swagger/doc.json` | 鍚?| OpenAPI JSON |

## R1 鐢ㄦ埛绔?API

| 鏂规硶 | 璺敱 | 璁よ瘉 | 璇存槑 |
|---|---|---|---|
| `POST` | `/api/v2/app/auth/wechat-login` | 鍚?| 寰俊鐧诲綍锛岀鍙?JWT |
| `GET` | `/api/v2/app/auth/me` | 鏄?| 鑾峰彇褰撳墠鐢ㄦ埛 |
| `POST` | `/api/v2/app/auth/logout` | 鏄?| 鐧诲嚭鍗犱綅锛屽鎴风娓呯悊 Token |
| `GET` | `/api/v2/app/user/profile` | 鏄?| 鑾峰彇鐢ㄦ埛璧勬枡 |
| `PUT` | `/api/v2/app/user/profile` | 鏄?| 鏇存柊鐢ㄦ埛璧勬枡 |
| `GET` | `/api/v2/app/user/addresses` | 鏄?| 鍦板潃鍒楄〃 |
| `POST` | `/api/v2/app/user/addresses` | 鏄?| 鏂板鍦板潃 |
| `PUT` | `/api/v2/app/user/addresses/:id` | 鏄?| 鏇存柊鍦板潃 |
| `DELETE` | `/api/v2/app/user/addresses/:id` | 鏄?| 鍒犻櫎鍦板潃 |
| `PUT` | `/api/v2/app/user/addresses/:id/default` | 鏄?| 璁剧疆榛樿鍦板潃 |

## R2 鍟嗗搧涓績 - 鐢ㄦ埛绔?
| 鏂规硶 | 璺敱 | 璁よ瘉 | 璇存槑 |
|---|---|---|---|
| `GET` | `/api/v2/app/categories` | 鍚?| 鍒嗙被鍒楄〃锛屼粎 `enabled` |
| `GET` | `/api/v2/app/products` | 鍚?| 鍟嗗搧鍒楄〃锛屼粎 `on_sale`锛涙敮鎸?`categoryId`銆乣keyword`銆乣page`銆乣pageSize`銆乣sort` |
| `GET` | `/api/v2/app/products/:id` | 鍚?| 鍟嗗搧璇︽儏锛屼粎 `on_sale`锛涜繑鍥?product/category/images/skus锛岀姝?`costPrice` |
| `GET` | `/api/v2/app/products/recommended` | 鍚?| 鎺ㄨ崘鍟嗗搧锛屼粎 `on_sale` |

## R2 鍟嗗搧涓績 - 鍚庡彴

| 鏂规硶 | 璺敱 | 璁よ瘉 | 鏉冮檺棰勭暀 | 璇存槑 |
|---|---|---|---|---|
| `GET` | `/api/v2/admin/categories` | 鏄?| `category_read` | 鍒嗙被鍒楄〃 |
| `POST` | `/api/v2/admin/categories` | 鏄?| `category_write` | 鍒涘缓鍒嗙被 |
| `PUT` | `/api/v2/admin/categories/:id` | 鏄?| `category_write` | 鏇存柊鍒嗙被 |
| `DELETE` | `/api/v2/admin/categories/:id` | 鏄?| `category_write` | 鍒犻櫎鍒嗙被锛涙湁鍟嗗搧淇濇姢 |
| `GET` | `/api/v2/admin/products` | 鏄?| `product_read` | 鍟嗗搧鍒楄〃 |
| `GET` | `/api/v2/admin/products/:id` | 鏄?| `product_read` | 鍟嗗搧璇︽儏 |
| `POST` | `/api/v2/admin/products` | 鏄?| `product_write` | 鍒涘缓鍟嗗搧 |
| `PUT` | `/api/v2/admin/products/:id` | 鏄?| `product_write` | 鏇存柊鍟嗗搧 |
| `POST` | `/api/v2/admin/products/:id/on-sale` | 鏄?| `product_shelf` | 鍟嗗搧涓婃灦 |
| `POST` | `/api/v2/admin/products/:id/off-sale` | 鏄?| `product_shelf` | 鍟嗗搧涓嬫灦 |
| `POST` | `/api/v2/admin/products/:id/skus` | 鏄?| `sku_write` | 鍒涘缓 SKU |
| `PUT` | `/api/v2/admin/skus/:id` | 鏄?| `sku_write` | 鏇存柊 SKU |
| `DELETE` | `/api/v2/admin/skus/:id` | 鏄?| `sku_write` | 鍒犻櫎 SKU |
| `POST` | `/api/v2/admin/products/:id/images` | 鏄?| `product_write` | 娣诲姞鍟嗗搧鍥剧墖 URL |
| `DELETE` | `/api/v2/admin/product-images/:id` | 鏄?| `product_write` | 鍒犻櫎鍟嗗搧鍥剧墖 |

## R3 搴撳瓨涓績 - 鐢ㄦ埛绔?
| 鏂规硶 | 璺敱 | 璁よ瘉 | 璇存槑 |
|---|---|---|---|
| `GET` | `/api/v2/app/products/:id` | 鍚?| 鍟嗗搧璇︽儏 SKU 澧炲姞 `availableStock`銆乣stockStatus` |

## R3 搴撳瓨涓績 - 鍚庡彴

| 鏂规硶 | 璺敱 | 璁よ瘉 | 鏉冮檺棰勭暀 | 璇存槑 |
|---|---|---|---|---|
| `GET` | `/api/v2/admin/inventories` | 鏄?| `inventory_read` | 搴撳瓨鍒楄〃锛屾敮鎸?SKU銆佸晢鍝併€佺姸鎬併€佷綆搴撳瓨銆佺己璐х瓫閫?|
| `GET` | `/api/v2/admin/inventories/:skuId` | 鏄?| `inventory_read` | SKU 搴撳瓨璇︽儏 |
| `POST` | `/api/v2/admin/inventories/:skuId/adjust` | 鏄?| `inventory_write` | 浜哄伐搴撳瓨璋冩暣锛屽繀椤讳骇鐢熸祦姘?|
| `GET` | `/api/v2/admin/inventory-transactions` | 鏄?| `inventory_read` | 搴撳瓨娴佹按鍒楄〃 |

## R4 璐墿杞︿腑蹇?- 鐢ㄦ埛绔?
| 鏂规硶 | 璺敱 | 璁よ瘉 | 璇存槑 |
|---|---|---|---|
| `GET` | `/api/v2/app/cart` | 鏄?| 鑾峰彇褰撳墠鐢ㄦ埛璐墿杞︼紝杩斿洖瀹炴椂鍟嗗搧/SKU/搴撳瓨鐘舵€佷笌灞曠ず灏忚 |
| `POST` | `/api/v2/app/cart/items` | 鏄?| 鍔犲叆璐墿杞︼紱鍚?SKU upsert 澧炲姞鏁伴噺锛涗笉閿佸簱瀛?|
| `PATCH` | `/api/v2/app/cart/items/:id` | 鏄?| 淇敼璐墿杞﹂」鏁伴噺锛涙暟閲?1-999锛涘簱瀛樹笉瓒虫椂鎷掔粷涓斾笉鏀瑰師鏁伴噺 |
| `PATCH` | `/api/v2/app/cart/items/:id/selected` | 鏄?| 淇敼鍗曢」閫変腑鐘舵€?|
| `PATCH` | `/api/v2/app/cart/selection` | 鏄?| 鎵归噺閫夋嫨锛涙棤 `itemIds` 鏃惰〃绀哄叏閫?鍙栨秷鍏ㄩ€?|
| `DELETE` | `/api/v2/app/cart/items/:id` | 鏄?| 鍒犻櫎璐墿杞﹂」锛涘繀椤绘寜褰撳墠鐢ㄦ埛闅旂 |
| `DELETE` | `/api/v2/app/cart/unavailable-items` | 鏄?| 娓呯悊宸蹭笅鏋躲€丼KU disabled銆佸晢鍝佷笉瀛樺湪绛夋案涔呭け鏁堥」锛涘簱瀛樹笉瓒充笉鑷姩鍒犻櫎 |

## R5 璁㈠崟涓績 - 鐢ㄦ埛绔?
| 鏂规硶 | 璺敱 | 璁よ瘉 | 璇存槑 |
|---|---|---|---|
| `POST` | `/api/v2/app/orders/preview` | 鏄?| 璁㈠崟纭棰勮锛涘疄鏃舵牎楠屽晢鍝併€丼KU銆佸簱瀛樹笌浠锋牸锛涗笉鍒涘缓璁㈠崟銆佷笉閿佸簱瀛?|
| `POST` | `/api/v2/app/orders` | 鏄?| 鍒涘缓璁㈠崟锛涙湇鍔＄閲嶇畻閲戦锛涙牎楠?`priceSnapshot`锛涗簨鍔″唴鍒涘缓璁㈠崟涓庨攣搴撳瓨 |
| `GET` | `/api/v2/app/orders` | 鏄?| 褰撳墠鐢ㄦ埛璁㈠崟鍒楄〃锛涙敮鎸?`status/page/pageSize` |
| `GET` | `/api/v2/app/orders/:id` | 鏄?| 褰撳墠鐢ㄦ埛璁㈠崟璇︽儏锛涚敤鎴烽殧绂?|
| `POST` | `/api/v2/app/orders/:id/cancel` | 鏄?| 鐢ㄦ埛鍙栨秷寰呮敮浠樿鍗曪紱浜嬪姟鍐呴噴鏀惧簱瀛?|
| `POST` | `/api/v2/app/orders/expired/close` | 禁止公开 | R6 起移除用户端公开入口；仅允许内部 Job / Scheduler 调用 `CloseExpiredOrders` 服务 |

## R5 璁㈠崟涓績 - 鍚庡彴

| 鏂规硶 | 璺敱 | 璁よ瘉 | 鏉冮檺棰勭暀 | 璇存槑 |
|---|---|---|---|---|
| `GET` | `/api/v2/admin/orders` | 鏄?| `order_read` | 鍚庡彴璁㈠崟鍒楄〃锛屽彧璇伙紱鏀寔璁㈠崟鍙枫€佺姸鎬併€佸晢鍝佸叧閿瘝绛涢€?|
| `GET` | `/api/v2/admin/orders/:id` | 鏄?| `order_read` | 鍚庡彴璁㈠崟璇︽儏锛屽彧璇?|

## 鍚庣画淇濈暀鍓嶇紑

- `/api/v2/mobile-admin`

## R6 支付中心 - 用户端

| 方法 | 路由 | 认证 | 说明 |
|---|---|---|---|
| `POST` | `/api/v2/app/orders/:id/payments` | 是 | 为待支付订单创建支付单；金额只读取订单 `payable_amount`，客户端不得提交金额 |
| `GET` | `/api/v2/app/orders/:id/payment-status` | 是 | 查询当前订单支付状态；可触发服务端主动查询渠道并同步结果 |

## R6 支付中心 - 渠道通知

| 方法 | 路由 | 认证 | 说明 |
|---|---|---|---|
| `POST` | `/api/v2/payments/wechat/notify` | 否 | 微信支付异步通知；通过微信签名验签确认真实性 |
| `POST` | `/api/v2/payments/mock/notify` | 否 | Mock 支付通知；仅开发/测试环境启用，生产环境禁止 |

## R6 支付中心 - 后台只读

| 方法 | 路由 | 认证 | 权限预留 | 说明 |
|---|---|---|---|---|
| `GET` | `/api/v2/admin/payments` | 是 | `payment_read` | 支付单列表，只读 |
| `GET` | `/api/v2/admin/payments/:id` | 是 | `payment_read` | 支付单详情，只读 |

## R7 退款中心 - 用户端

| 方法 | 路由 | 认证 | 说明 |
|---|---|---|---|
| `GET` | `/api/v2/app/refunds/:id` | 是 | 用户查看自己的退款单详情 |
| `GET` | `/api/v2/app/orders/:id/refund` | 是 | 用户查看指定订单关联退款单 |

## R7 退款中心 - 后台端

| 方法 | 路由 | 认证 | 权限预留 | 说明 |
|---|---|---|---|---|
| `GET` | `/api/v2/admin/refunds` | 是 | `refund_read` | 后台分页查询退款单 |
| `GET` | `/api/v2/admin/refunds/:id` | 是 | `refund_read` | 后台查询退款单详情与事件 |
| `POST` | `/api/v2/admin/orders/:id/refund` | 是 | `refund_create` | 后台对已支付订单发起整单全额退款 |

## R7 退款中心 - 渠道通知

| 方法 | 路由 | 认证 | 说明 |
|---|---|---|---|
| `POST` | `/api/v2/refunds/wechat/notify` | 否 | 微信退款异步通知，验签后处理 |
| `POST` | `/api/v2/refunds/mock/notify` | 否 | Mock 退款通知，仅开发/测试环境可用 |
