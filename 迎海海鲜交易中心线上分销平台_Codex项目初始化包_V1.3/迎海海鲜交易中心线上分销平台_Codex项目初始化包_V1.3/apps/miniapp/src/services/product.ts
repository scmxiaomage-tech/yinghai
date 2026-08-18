import { request } from "./http";

export interface CategoryItem {
  id: string;
  parentId?: string | null;
  name: string;
  code: string;
  iconUrl?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  subtitle?: string | null;
  productCode?: string;
  mainImageUrl?: string | null;
  unit?: string;
  origin?: string | null;
  storageMethod?: string | null;
  recommendStatus?: boolean;
  categoryId?: string;
  categoryName?: string;
  minSalePrice?: string | number | null;
  maxSalePrice?: string | number | null;
  marketPrice?: string | number | null;
  minMarketPrice?: string | number | null;
  hasStock?: boolean;
}

export interface ProductSku {
  id: string;
  skuNo: string;
  name: string;
  spec: Record<string, unknown>;
  salePrice: string;
  marketPrice?: string | null;
  memberPrice?: string | null;
  weight?: string | null;
  weightUnit?: string | null;
  status: "enabled" | "disabled";
  availableStock?: number;
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface ProductDetail extends ProductListItem {
  description?: string | null;
  shelfStatus: "on_sale";
  category: { id: string; name: string };
  images: Array<{ id: string; url: string; type: "main" | "detail"; sortOrder: number }>;
  skus: ProductSku[];
}

export function getCategories() {
  return request<CategoryItem[]>({ url: "/categories" });
}

export function getProducts(params: {
  categoryId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  sort?: "default" | "price_asc" | "price_desc";
} = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  return request<{ page: number; pageSize: number; items: ProductListItem[] }>({
    url: `/products${query.toString() ? `?${query.toString()}` : ""}`
  });
}

export function getRecommendedProducts() {
  return request<ProductListItem[]>({ url: "/products/recommended" });
}

export function getProductDetail(id: string) {
  return request<ProductDetail>({ url: `/products/${id}` });
}
