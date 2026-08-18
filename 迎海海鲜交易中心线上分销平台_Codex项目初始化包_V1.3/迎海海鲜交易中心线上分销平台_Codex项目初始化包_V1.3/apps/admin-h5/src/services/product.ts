import { adminRequest } from "./http";

export interface AdminProductRow {
  id: string;
  name: string;
  productNo: string;
  categoryName: string;
  shelf_status: "draft" | "on_sale" | "off_sale";
  shelfStatus?: "draft" | "on_sale" | "off_sale";
  minSalePrice?: string | number | null;
  marketPrice?: string | number | null;
  hasStock?: boolean;
}

export interface AdminCategoryRow {
  id: string;
  name: string;
  code: string;
  status: "enabled" | "disabled";
  sortOrder: number;
}

export function getAdminProducts() {
  return adminRequest<{ page: number; pageSize: number; items: AdminProductRow[] }>({
    url: "/products?pageSize=50"
  });
}

export function getAdminCategories() {
  return adminRequest<AdminCategoryRow[]>({ url: "/categories" });
}

export function onSaleProduct(id: string) {
  return adminRequest<{ shelfStatus: "on_sale" }>({ url: `/products/${id}/on-sale`, method: "POST" });
}

export function offSaleProduct(id: string) {
  return adminRequest<{ shelfStatus: "off_sale" }>({ url: `/products/${id}/off-sale`, method: "POST" });
}

export interface InventoryRow {
  skuId: string;
  skuNo: string;
  skuName: string;
  productId: string;
  productName: string;
  totalStock: number;
  lockedStock: number;
  availableStock: number;
  soldStock: number;
  warningStock: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface InventoryTransactionRow {
  id: string;
  skuId: string;
  type: string;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  beforeLockedStock: number;
  afterLockedStock: number;
  remark?: string;
  createdAt: string;
}

export function getAdminInventories() {
  return adminRequest<{ page: number; pageSize: number; total: number; items: InventoryRow[] }>({ url: "/inventories?pageSize=50" });
}

export function adjustInventory(skuId: string, data: { adjustmentType: "INCREASE" | "DECREASE"; quantity: number; remark?: string }) {
  return adminRequest<InventoryRow>({ url: `/inventories/${skuId}/adjust`, method: "POST", data });
}

export function getInventoryTransactions() {
  return adminRequest<{ page: number; pageSize: number; total: number; items: InventoryTransactionRow[] }>({ url: "/inventory-transactions?pageSize=20" });
}
