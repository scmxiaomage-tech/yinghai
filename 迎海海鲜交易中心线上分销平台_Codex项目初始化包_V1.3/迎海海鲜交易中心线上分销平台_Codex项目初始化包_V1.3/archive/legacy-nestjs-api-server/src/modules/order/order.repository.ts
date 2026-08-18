import { Injectable } from "@nestjs/common";
import { Pool, PoolClient } from "pg";

export type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

export interface OrderListFilters {
  userId?: string;
  status?: string;
  orderNo?: string;
  user?: string;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class OrderRepository {
  async findCart(userId: string, db: Queryable) {
    const result = await db.query(
      `SELECT c.id,
              c.sku_id AS "skuId",
              c.quantity,
              c.selected,
              c.created_at AS "createdAt",
              c.updated_at AS "updatedAt",
              s.status AS "skuStatus",
              s.name AS "skuName",
              s.sku_code AS "skuCode",
              s.sale_price AS "salePrice",
              s.spec_json AS "specSnapshot",
              p.id AS "productId",
              p.name AS "productName",
              p.main_image_url AS "mainImageUrl",
              p.shelf_status AS "shelfStatus",
              p.deleted_at AS "productDeletedAt",
              COALESCE(i.available_stock, 0)::int AS "availableStock"
         FROM cart c
         LEFT JOIN sku s ON s.id = c.sku_id AND s.deleted_at IS NULL
         LEFT JOIN product p ON p.id = s.product_id
         LEFT JOIN inventory i ON i.sku_id = s.id
        WHERE c.user_id = $1
          AND c.deleted_at IS NULL
        ORDER BY c.updated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async findCartItemsByIds(userId: string, ids: string[], db: Queryable) {
    const result = await db.query(
      `SELECT id, sku_id AS "skuId", quantity, selected
         FROM cart
        WHERE user_id = $1
          AND id = ANY($2::uuid[])
          AND deleted_at IS NULL`,
      [userId, ids]
    );
    return result.rows;
  }

  async findActiveCartItem(userId: string, skuId: string, db: Queryable) {
    const result = await db.query(
      "SELECT id, sku_id AS \"skuId\", quantity FROM cart WHERE user_id = $1 AND sku_id = $2 AND deleted_at IS NULL",
      [userId, skuId]
    );
    return result.rows[0];
  }

  async upsertCart(userId: string, skuId: string, quantity: number, db: Queryable) {
    const result = await db.query(
      `INSERT INTO cart (user_id, sku_id, quantity, selected)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (user_id, sku_id) WHERE deleted_at IS NULL
       DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity,
                     selected = true,
                     updated_at = now()
       RETURNING id, sku_id AS "skuId", quantity, selected, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [userId, skuId, quantity]
    );
    return result.rows[0];
  }

  async updateCart(id: string, userId: string, quantity: number, db: Queryable) {
    const result = await db.query(
      `UPDATE cart
          SET quantity = $3,
              updated_at = now()
        WHERE id = $1
          AND user_id = $2
          AND deleted_at IS NULL
        RETURNING id, sku_id AS "skuId", quantity, selected, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, userId, quantity]
    );
    return result.rows[0];
  }

  async deleteCart(id: string, userId: string, db: Queryable) {
    const result = await db.query(
      `UPDATE cart
          SET deleted_at = now(),
              updated_at = now()
        WHERE id = $1
          AND user_id = $2
          AND deleted_at IS NULL
        RETURNING id`,
      [id, userId]
    );
    return result.rows[0];
  }

  async setCartSelected(id: string, userId: string, selected: boolean, db: Queryable) {
    const result = await db.query(
      `UPDATE cart
          SET selected = $3,
              updated_at = now()
        WHERE id = $1
          AND user_id = $2
          AND deleted_at IS NULL
        RETURNING id, selected`,
      [id, userId, selected]
    );
    return result.rows[0];
  }

  async setAllCartSelected(userId: string, selected: boolean, db: Queryable) {
    const result = await db.query(
      `UPDATE cart
          SET selected = $2,
              updated_at = now()
        WHERE user_id = $1
          AND deleted_at IS NULL
        RETURNING id`,
      [userId, selected]
    );
    return result.rows.length;
  }

  async clearInvalidCart(userId: string, db: Queryable) {
    const result = await db.query(
      `UPDATE cart c
          SET deleted_at = now(),
              updated_at = now()
        WHERE c.user_id = $1
          AND c.deleted_at IS NULL
          AND EXISTS (
            SELECT 1
              FROM sku s
              LEFT JOIN product p ON p.id = s.product_id
              LEFT JOIN inventory i ON i.sku_id = s.id
             WHERE s.id = c.sku_id
               AND (
                 s.deleted_at IS NOT NULL
                 OR s.status <> 'enabled'
                 OR p.deleted_at IS NOT NULL
                 OR p.shelf_status <> 'on_sale'
                 OR COALESCE(i.available_stock, 0) <= 0
                 OR c.quantity > COALESCE(i.available_stock, 0)
               )
          )
        RETURNING id`,
      [userId]
    );
    return result.rows;
  }

  async findOrderableSkus(skuIds: string[], db: Queryable) {
    const result = await db.query(
      `SELECT s.id AS "skuId",
              s.sku_code AS "skuCode",
              s.name AS "skuName",
              s.sale_price AS "salePrice",
              s.status AS "skuStatus",
              s.spec_json AS "specSnapshot",
              p.id AS "productId",
              p.name AS "productName",
              p.main_image_url AS "mainImageUrl",
              p.shelf_status AS "shelfStatus",
              p.deleted_at AS "productDeletedAt",
              COALESCE(i.available_stock, 0)::int AS "availableStock"
         FROM sku s
         JOIN product p ON p.id = s.product_id
         LEFT JOIN inventory i ON i.sku_id = s.id
        WHERE s.id = ANY($1::uuid[])
          AND s.deleted_at IS NULL`,
      [skuIds]
    );
    return result.rows;
  }

  async findAddress(userId: string, addressId: string, db: Queryable) {
    const result = await db.query(
      `SELECT id,
              receiver_name AS "receiverName",
              receiver_phone AS "receiverPhone",
              province,
              city,
              district,
              detail_address AS "detailAddress",
              NULL::varchar AS "doorNo",
              longitude,
              latitude
         FROM user_address
        WHERE id = $1
          AND user_id = $2
          AND deleted_at IS NULL`,
      [addressId, userId]
    );
    return result.rows[0];
  }

  async findOrderByIdempotencyKey(userId: string, idempotencyKey: string, db: Queryable) {
    const result = await db.query(
      "SELECT id FROM orders WHERE user_id = $1 AND idempotency_key = $2 LIMIT 1",
      [userId, idempotencyKey]
    );
    return result.rows[0];
  }

  async insertOrder(input: Record<string, unknown>, db: Queryable) {
    const result = await db.query(
      `INSERT INTO orders (
        order_no, user_id, address_id, receiver_name, receiver_phone,
        province, city, district, detail_address, door_no, longitude, latitude,
        delivery_remark, goods_amount, discount_amount, delivery_fee,
        payable_amount, paid_amount, order_status, payment_status, delivery_status,
        remark, delivery_risk_confirmed, idempotency_key
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, 0, 'pending_payment', 'unpaid', 'pending',
        $18, $19, $20
      )
      RETURNING id, order_no AS "orderNo", created_at AS "createdAt"`,
      [
        input.orderNo,
        input.userId,
        input.addressId,
        input.receiverName,
        input.receiverPhone,
        input.province,
        input.city,
        input.district,
        input.detailAddress,
        input.doorNo,
        input.longitude,
        input.latitude,
        input.deliveryRemark,
        input.goodsAmount,
        input.discountAmount,
        input.deliveryFee,
        input.payableAmount,
        input.remark,
        input.deliveryRiskConfirmed,
        input.idempotencyKey
      ]
    );
    return result.rows[0];
  }

  async lockInventory(items: Array<{ skuId: string; quantity: number }>, db: Queryable) {
    for (const item of items) {
      const locked = await db.query(
        `UPDATE inventory SET available_stock=available_stock-$2, locked_stock=locked_stock+$2, updated_at=now()
         WHERE sku_id=$1 AND available_stock >= $2 RETURNING sku_id`,
        [item.skuId, item.quantity]
      );
      if (!locked.rows[0]) throw new Error("Insufficient stock during inventory lock");
    }
  }

  async releaseInventory(orderId: string, db: Queryable) {
    await db.query(
      `UPDATE inventory i SET available_stock=i.available_stock+x.quantity, locked_stock=i.locked_stock-x.quantity, updated_at=now()
       FROM (SELECT sku_id, SUM(quantity)::int quantity FROM order_items WHERE order_id=$1 GROUP BY sku_id) x
       WHERE i.sku_id=x.sku_id AND i.locked_stock >= x.quantity`, [orderId]
    );
  }

  async confirmInventoryConsumption(orderId: string, db: Queryable) {
    await db.query(
      `UPDATE inventory i SET locked_stock=i.locked_stock-x.quantity, updated_at=now()
       FROM (SELECT sku_id, SUM(quantity)::int quantity FROM order_items WHERE order_id=$1 GROUP BY sku_id) x
       WHERE i.sku_id=x.sku_id AND i.locked_stock >= x.quantity`, [orderId]
    );
  }

  async insertOrderItems(orderId: string, items: Array<Record<string, unknown>>, db: Queryable) {
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (
          order_id, product_id, sku_id, product_name, main_image_url,
          sku_name, sku_code, spec_snapshot, unit_price, quantity,
          subtotal_amount, after_sale_status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'none')`,
        [
          orderId,
          item.productId,
          item.skuId,
          item.productName,
          item.mainImageUrl,
          item.skuName,
          item.skuCode,
          item.specSnapshot,
          item.unitPrice,
          item.quantity,
          item.subtotalAmount
        ]
      );
    }
  }

  async softDeleteSettledCart(userId: string, cartItemIds: string[], db: Queryable) {
    if (cartItemIds.length === 0) return;
    await db.query(
      `UPDATE cart
          SET deleted_at = now(),
              updated_at = now()
        WHERE user_id = $1
          AND id = ANY($2::uuid[])
          AND deleted_at IS NULL`,
      [userId, cartItemIds]
    );
  }

  async insertMessage(input: { userId: string | null; title: string; content: string; messageType: string }, db: Queryable) {
    await db.query(
      `INSERT INTO message (user_id, title, content, message_type, read_status)
       VALUES ($1, $2, $3, $4, 'unread')`,
      [input.userId, input.title, input.content, input.messageType]
    );
  }

  async findOrders(filters: OrderListFilters, db: Queryable) {
    const where: string[] = [];
    const params: unknown[] = [];

    const add = (clause: string, value: unknown) => {
      params.push(value);
      where.push(clause.replace("?", `$${params.length}`));
    };

    if (filters.userId) add("o.user_id = ?", filters.userId);
    if (filters.status) add("o.order_status = ?", filters.status);
    if (filters.orderNo) add("o.order_no ILIKE ?", `%${filters.orderNo}%`);
    if (filters.orderStatus) add("o.order_status = ?", filters.orderStatus);
    if (filters.paymentStatus) add("o.payment_status = ?", filters.paymentStatus);
    if (filters.createdAt) add("o.created_at::date = ?::date", filters.createdAt);
    if (filters.user) {
      params.push(`%${filters.user}%`, `%${filters.user}%`);
      where.push(`(u.phone ILIKE $${params.length - 1} OR u.openid ILIKE $${params.length})`);
    }

    const page = Math.max(filters.page ?? 1, 1);
    const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
    params.push(pageSize, (page - 1) * pageSize);
    const limitIndex = params.length - 1;
    const offsetIndex = params.length;

    const result = await db.query(
      `SELECT o.id,
              o.order_no AS "orderNo",
              o.user_id AS "userId",
              u.phone AS "userPhone",
              o.receiver_name AS "receiverName",
              o.receiver_phone AS "receiverPhone",
              o.goods_amount AS "goodsAmount",
              o.discount_amount AS "discountAmount",
              o.delivery_fee AS "deliveryFee",
              o.payable_amount AS "payableAmount",
              o.paid_amount AS "paidAmount",
              o.order_status AS "orderStatus",
              o.payment_status AS "paymentStatus",
              o.delivery_status AS "deliveryStatus",
              o.created_at AS "createdAt",
              o.cancelled_at AS "cancelledAt",
              COALESCE(string_agg(oi.product_name || ' x' || oi.quantity, '，' ORDER BY oi.created_at), '') AS "goodsSummary"
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        GROUP BY o.id, u.phone
        ORDER BY o.created_at DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      params
    );
    return { page, pageSize, items: result.rows };
  }

  async findOrder(id: string, userId: string | undefined, db: Queryable) {
    const where = userId ? "o.id = $1 AND o.user_id = $2" : "o.id = $1";
    const params = userId ? [id, userId] : [id];
    const result = await db.query(
      `SELECT o.id,
              o.order_no AS "orderNo",
              o.user_id AS "userId",
              u.phone AS "userPhone",
              o.address_id AS "addressId",
              o.receiver_name AS "receiverName",
              o.receiver_phone AS "receiverPhone",
              o.province,
              o.city,
              o.district,
              o.detail_address AS "detailAddress",
              o.door_no AS "doorNo",
              o.longitude,
              o.latitude,
              o.delivery_remark AS "deliveryRemark",
              o.goods_amount AS "goodsAmount",
              o.discount_amount AS "discountAmount",
              o.delivery_fee AS "deliveryFee",
              o.payable_amount AS "payableAmount",
              o.paid_amount AS "paidAmount",
              o.order_status AS "orderStatus",
              o.payment_status AS "paymentStatus",
              o.delivery_status AS "deliveryStatus",
              o.cancel_reason AS "cancelReason",
              o.remark,
              o.delivery_risk_confirmed AS "deliveryRiskConfirmed",
              o.created_at AS "createdAt",
              o.updated_at AS "updatedAt",
              o.paid_at AS "paidAt",
              o.shipped_at AS "shippedAt",
              o.completed_at AS "completedAt",
              o.cancelled_at AS "cancelledAt"
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
        WHERE ${where}`,
      params
    );
    const order = result.rows[0];
    if (!order) return undefined;
    const items = await db.query(
      `SELECT id,
              product_id AS "productId",
              sku_id AS "skuId",
              product_name AS "productName",
              main_image_url AS "mainImageUrl",
              sku_name AS "skuName",
              sku_code AS "skuCode",
              spec_snapshot AS "specSnapshot",
              unit_price AS "unitPrice",
              quantity,
              subtotal_amount AS "subtotalAmount",
              after_sale_status AS "afterSaleStatus",
              created_at AS "createdAt"
         FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC`,
      [id]
    );
    return { ...order, items: items.rows };
  }

  async cancelOrder(id: string, userId: string, cancelReason: string, db: Queryable) {
    const result = await db.query(
      `UPDATE orders
          SET order_status = 'cancelled',
              cancel_reason = $3,
              cancelled_at = now(),
              updated_at = now()
        WHERE id = $1
          AND user_id = $2
          AND order_status = 'pending_payment'
          AND payment_status = 'unpaid'
        RETURNING id, order_status AS "orderStatus", cancelled_at AS "cancelledAt"`,
      [id, userId, cancelReason]
    );
    return result.rows[0];
  }
}
