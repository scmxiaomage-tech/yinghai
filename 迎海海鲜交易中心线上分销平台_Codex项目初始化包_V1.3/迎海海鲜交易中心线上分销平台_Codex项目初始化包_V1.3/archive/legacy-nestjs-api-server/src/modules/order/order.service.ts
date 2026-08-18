import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Pool, PoolClient } from "pg";
import { DATABASE_POOL } from "../../infrastructure/database/database.provider";
import { AddCartItemDto, SelectAllCartDto, SelectCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";
import { CancelOrderDto, CreateOrderDto, OrderPreviewDto } from "./dto/order.dto";
import { OrderListFilters, OrderRepository } from "./order.repository";

type RawCartRow = Record<string, unknown> & {
  id: string;
  skuId: string | null;
  quantity: number;
  selected: boolean;
  availableStock: number;
  skuStatus: string | null;
  shelfStatus: string | null;
  productDeletedAt: Date | null;
};

type CheckedLine = {
  cartItemId?: string;
  skuId: string;
  quantity: number;
  productId: string;
  productName: string;
  mainImageUrl: string | null;
  skuName: string;
  skuCode: string;
  specSnapshot: unknown;
  unitPrice: number;
  subtotalAmount: number;
  availableStock: number;
};

type SourceLine = {
  cartItemId?: string;
  skuId: string;
  quantity: number;
};

@Injectable()
export class OrderService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly repository: OrderRepository
  ) {}

  async cart(userId: string) {
    const rows = await this.repository.findCart(userId, this.pool);
    return rows.map((row: RawCartRow) => {
      const invalidReason = this.cartInvalidReason(row);
      return {
        ...row,
        valid: invalidReason === null,
        invalidReason
      };
    });
  }

  async addCart(userId: string, dto: AddCartItemDto) {
    const current = await this.repository.findActiveCartItem(userId, dto.skuId, this.pool);
    await this.assertSkuOrderable(dto.skuId, dto.quantity + (current?.quantity ?? 0), this.pool);
    return this.repository.upsertCart(userId, dto.skuId, dto.quantity, this.pool);
  }

  async updateCart(userId: string, id: string, dto: UpdateCartItemDto) {
    const current = await this.findCartItemOrFail(userId, id);
    await this.assertSkuOrderable(current.skuId, dto.quantity, this.pool);
    const result = await this.repository.updateCart(id, userId, dto.quantity, this.pool);
    if (!result) throw new NotFoundException("Cart item not found");
    return result;
  }

  async deleteCart(userId: string, id: string) {
    const result = await this.repository.deleteCart(id, userId, this.pool);
    if (!result) throw new NotFoundException("Cart item not found");
    return { id, deleted: true };
  }

  async selectCart(userId: string, id: string, dto: SelectCartItemDto) {
    if (dto.selected) {
      const current = await this.findCartItemOrFail(userId, id);
      await this.assertSkuOrderable(current.skuId, current.quantity, this.pool);
    }
    const result = await this.repository.setCartSelected(id, userId, dto.selected, this.pool);
    if (!result) throw new NotFoundException("Cart item not found");
    return result;
  }

  async selectAllCart(userId: string, dto: SelectAllCartDto) {
    if (dto.selected) {
      const invalidItems = (await this.cart(userId)).filter((item: { valid: boolean }) => !item.valid);
      if (invalidItems.length > 0) throw new BadRequestException("Invalid cart items cannot be selected for checkout");
    }
    return {
      updated: await this.repository.setAllCartSelected(userId, dto.selected, this.pool),
      selected: dto.selected
    };
  }

  async clearInvalidCart(userId: string) {
    const rows = await this.repository.clearInvalidCart(userId, this.pool);
    return { cleared: rows.length, ids: rows.map((row: { id: string }) => row.id) };
  }

  async preview(userId: string, dto: OrderPreviewDto) {
    const calculated = await this.calculate(userId, dto, this.pool);
    return {
      source: dto.source,
      address: calculated.address,
      items: calculated.items,
      goodsAmount: calculated.goodsAmount,
      discountAmount: 0,
      deliveryFee: calculated.deliveryFee,
      payableAmount: calculated.payableAmount,
      paidAmount: 0,
      deliveryRiskRequired: calculated.deliveryRiskRequired,
      paymentNotice: "Sprint3 only creates pending-payment orders; real payment opens in Sprint4."
    };
  }

  async create(userId: string, dto: CreateOrderDto, idempotencyKey?: string) {
    const safeKey = this.normalizeIdempotencyKey(idempotencyKey);
    if (safeKey) {
      const existing = await this.repository.findOrderByIdempotencyKey(userId, safeKey, this.pool);
      if (existing) return this.detail(userId, existing.id);
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (safeKey) {
        const existing = await this.repository.findOrderByIdempotencyKey(userId, safeKey, client);
        if (existing) {
          await client.query("COMMIT");
          return this.detail(userId, existing.id);
        }
      }

      const calculated = await this.calculate(userId, dto, client);
      await this.repository.lockInventory(calculated.items.map((item) => ({ skuId: item.skuId, quantity: item.quantity })), client);
      const created = await this.createOrderRowWithUniqueNo(userId, dto, calculated, safeKey, client);
      await this.repository.insertOrderItems(created.id, calculated.items, client);

      if (dto.source === "cart") {
        await this.repository.softDeleteSettledCart(
          userId,
          calculated.items.map((item) => item.cartItemId).filter((id): id is string => Boolean(id)),
          client
        );
      }

      await this.repository.insertMessage(
        {
          userId,
          title: "订单已创建",
          content: `订单 ${created.orderNo} 已创建，请及时付款。`,
          messageType: "ORDER_CREATED"
        },
        client
      );
      await this.repository.insertMessage(
        {
          userId: null,
          title: "新订单提醒",
          content: `新订单 ${created.orderNo} 已创建，等待用户付款。`,
          messageType: "NEW_ORDER"
        },
        client
      );

      await client.query("COMMIT");
      return this.detail(userId, created.id);
    } catch (error) {
      await client.query("ROLLBACK");
      if (this.isUniqueViolation(error) && safeKey) {
        const existing = await this.repository.findOrderByIdempotencyKey(userId, safeKey, this.pool);
        if (existing) return this.detail(userId, existing.id);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async list(userId: string, input: { status?: string; page?: string; pageSize?: string }) {
    const filters: OrderListFilters = {
      userId,
      status: this.normalizeUserOrderStatus(input.status),
      page: this.toPage(input.page),
      pageSize: this.toPageSize(input.pageSize)
    };
    return this.repository.findOrders(filters, this.pool);
  }

  async detail(userId: string, id: string) {
    const order = await this.repository.findOrder(id, userId, this.pool);
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async adminList(input: {
    orderNo?: string;
    user?: string;
    orderStatus?: string;
    paymentStatus?: string;
    createdAt?: string;
    page?: string;
    pageSize?: string;
  }) {
    return this.repository.findOrders(
      {
        orderNo: input.orderNo,
        user: input.user,
        orderStatus: input.orderStatus,
        paymentStatus: input.paymentStatus,
        createdAt: input.createdAt,
        page: this.toPage(input.page),
        pageSize: this.toPageSize(input.pageSize)
      },
      this.pool
    );
  }

  async adminDetail(id: string) {
    const order = await this.repository.findOrder(id, undefined, this.pool);
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async cancel(userId: string, id: string, dto: CancelOrderDto) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const existing = await this.repository.findOrder(id, userId, client);
      if (!existing) throw new NotFoundException("Order not found");
      if (existing.orderStatus === "cancelled") {
        await client.query("COMMIT");
        return existing;
      }
      const result = await this.repository.cancelOrder(id, userId, dto.cancelReason ?? "用户取消订单", client);
      if (!result) throw new BadRequestException("Only unpaid pending-payment orders can be cancelled");
      await this.repository.releaseInventory(id, client);
      await this.repository.insertMessage(
        {
          userId,
          title: "订单已取消",
          content: `订单 ${existing.orderNo} 已取消。`,
          messageType: "ORDER_CANCELLED"
        },
        client
      );
      await client.query("COMMIT");
      return this.detail(userId, id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async calculate(userId: string, dto: OrderPreviewDto, db: Pool | PoolClient) {
    const address = await this.repository.findAddress(userId, dto.addressId, db);
    if (!address) throw new BadRequestException("Address not found or unavailable");

    const deliveryRiskRequired = !this.isInSupportedDeliveryRange(address);
    if (deliveryRiskRequired && !dto.deliveryRiskConfirmed) {
      throw new BadRequestException("Current address is outside delivery range; confirm delivery risk first");
    }

    const sourceLines = await this.resolveSourceLines(userId, dto, db);
    const quantities = new Map<string, { quantity: number; cartItemId?: string }>();
    for (const line of sourceLines) {
      const current = quantities.get(line.skuId);
      quantities.set(line.skuId, {
        quantity: (current?.quantity ?? 0) + line.quantity,
        cartItemId: line.cartItemId ?? current?.cartItemId
      });
    }

    const skus = await this.repository.findOrderableSkus([...quantities.keys()], db);
    if (skus.length !== quantities.size) throw new BadRequestException("SKU not found");

    const items: CheckedLine[] = skus.map((sku) => {
      const quantityInfo = quantities.get(sku.skuId)!;
      if (sku.skuStatus !== "enabled" || sku.shelfStatus !== "on_sale" || sku.productDeletedAt) {
        throw new BadRequestException("SKU is unavailable");
      }
      if (Number(sku.availableStock) < quantityInfo.quantity) {
        throw new BadRequestException("Insufficient stock");
      }
      const unitPrice = this.money(sku.salePrice);
      return {
        cartItemId: quantityInfo.cartItemId,
        skuId: sku.skuId,
        quantity: quantityInfo.quantity,
        productId: sku.productId,
        productName: sku.productName,
        mainImageUrl: sku.mainImageUrl,
        skuName: sku.skuName,
        skuCode: sku.skuCode,
        specSnapshot: sku.specSnapshot,
        unitPrice,
        subtotalAmount: this.roundMoney(unitPrice * quantityInfo.quantity),
        availableStock: Number(sku.availableStock)
      };
    });

    const goodsAmount = this.roundMoney(items.reduce((sum, item) => sum + item.subtotalAmount, 0));
    const deliveryFee = this.deliveryFee(goodsAmount);
    return {
      address,
      items,
      goodsAmount,
      discountAmount: 0,
      deliveryFee,
      payableAmount: this.roundMoney(goodsAmount + deliveryFee),
      deliveryRiskRequired
    };
  }

  private async resolveSourceLines(userId: string, dto: OrderPreviewDto, db: Pool | PoolClient): Promise<SourceLine[]> {
    if (dto.source === "buy_now") {
      if (!dto.skuId || !dto.quantity) throw new BadRequestException("skuId and quantity are required for buy_now");
      return [{ skuId: dto.skuId, quantity: dto.quantity }];
    }

    const cartItemIds = dto.cartItemIds ?? [];
    if (cartItemIds.length === 0) throw new BadRequestException("cartItemIds are required for cart checkout");
    const rows = await this.repository.findCartItemsByIds(userId, cartItemIds, db);
    if (rows.length !== new Set(cartItemIds).size) throw new BadRequestException("Cart item not found");
    return rows.map((row) => ({ cartItemId: row.id, skuId: row.skuId, quantity: row.quantity }));
  }

  private async assertSkuOrderable(skuId: string, quantity: number, db: Pool | PoolClient) {
    const rows = await this.repository.findOrderableSkus([skuId], db);
    const sku = rows[0];
    if (!sku || sku.skuStatus !== "enabled" || sku.shelfStatus !== "on_sale" || sku.productDeletedAt) {
      throw new BadRequestException("SKU is unavailable");
    }
    if (Number(sku.availableStock) < quantity) throw new BadRequestException("Insufficient stock");
  }

  private async findCartItemOrFail(userId: string, id: string) {
    const result = await this.pool.query(
      "SELECT id, sku_id AS \"skuId\", quantity FROM cart WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
      [id, userId]
    );
    if (!result.rows[0]) throw new NotFoundException("Cart item not found");
    return result.rows[0] as { id: string; skuId: string; quantity: number };
  }

  private cartInvalidReason(row: RawCartRow) {
    if (!row.skuId || row.productDeletedAt) return "deleted";
    if (row.shelfStatus !== "on_sale") return "product_off_sale";
    if (row.skuStatus !== "enabled") return "sku_disabled";
    if (Number(row.availableStock) <= 0) return "out_of_stock";
    if (Number(row.availableStock) < Number(row.quantity)) return "insufficient_stock";
    return null;
  }

  private async createOrderRowWithUniqueNo(
    userId: string,
    dto: CreateOrderDto,
    calculated: Awaited<ReturnType<OrderService["calculate"]>>,
    idempotencyKey: string | null,
    db: PoolClient
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.repository.insertOrder(
          {
            orderNo: this.orderNo(),
            userId,
            addressId: calculated.address.id,
            receiverName: calculated.address.receiverName,
            receiverPhone: calculated.address.receiverPhone,
            province: calculated.address.province,
            city: calculated.address.city,
            district: calculated.address.district,
            detailAddress: calculated.address.detailAddress,
            doorNo: calculated.address.doorNo,
            longitude: calculated.address.longitude,
            latitude: calculated.address.latitude,
            deliveryRemark: dto.deliveryRemark ?? null,
            goodsAmount: calculated.goodsAmount,
            discountAmount: 0,
            deliveryFee: calculated.deliveryFee,
            payableAmount: calculated.payableAmount,
            remark: dto.remark ?? null,
            deliveryRiskConfirmed: Boolean(dto.deliveryRiskConfirmed),
            idempotencyKey
          },
          db
        );
      } catch (error) {
        if (!this.isUniqueViolation(error)) throw error;
        if (idempotencyKey) throw error;
      }
    }
    throw new ConflictException("Unable to allocate order number");
  }

  private normalizeIdempotencyKey(value?: string) {
    const normalized = value?.trim();
    if (!normalized) return null;
    if (normalized.length > 128) throw new BadRequestException("Idempotency-Key is too long");
    return normalized;
  }

  private normalizeUserOrderStatus(status?: string) {
    if (!status || status === "all") return undefined;
    if (status === "pending_payment" || status === "cancelled") return status;
    throw new BadRequestException("Unsupported order status filter in Sprint3");
  }

  private isInSupportedDeliveryRange(address: { province?: string; city?: string }) {
    return String(address.province ?? "").includes("上海") || String(address.city ?? "").includes("上海");
  }

  private deliveryFee(goodsAmount: number) {
    return goodsAmount >= 199 ? 0 : 20;
  }

  private money(value: unknown) {
    return Number.parseFloat(String(value ?? 0));
  }

  private roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private orderNo() {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0")
    ].join("");
    return `YH${stamp}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  private toPage(value?: string) {
    const page = Number.parseInt(value ?? "1", 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
  }

  private toPageSize(value?: string) {
    const pageSize = Number.parseInt(value ?? "20", 10);
    return Number.isFinite(pageSize) ? Math.min(Math.max(pageSize, 1), 100) : 20;
  }

  private isUniqueViolation(error: unknown): error is { code: string } {
    return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "23505";
  }
}
