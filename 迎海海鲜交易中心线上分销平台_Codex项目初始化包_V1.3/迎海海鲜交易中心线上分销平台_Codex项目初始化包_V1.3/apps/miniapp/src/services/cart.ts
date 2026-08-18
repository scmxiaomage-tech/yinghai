import { request } from "./http";

export interface CartItem {
  id: string;
  productId?: string;
  skuId: string;
  productName: string;
  skuName: string;
  mainImageUrl?: string | null;
  quantity: number;
  selected: boolean;
  salePrice: string | number;
  marketPrice?: string | number | null;
  availableStock: number;
  available: boolean;
  unavailableReason?: string | null;
}

export interface CartSummary {
  cartItems: CartItem[];
  selectedCount: number;
  selectedQuantity: number;
  subtotal: number;
}

export function getCart() {
  return request<CartSummary>({ url: "/cart" });
}

export function addCartItem(skuId: string | number, quantity: number) {
  return request<{ added: boolean }>({ url: "/cart/items", method: "POST", data: { skuId, quantity } });
}

export function updateCartItem(id: string | number, quantity: number) {
  return request<{ updated: boolean }>({ url: `/cart/items/${id}`, method: "PATCH", data: { quantity } });
}

export function deleteCartItem(id: string | number) {
  return request<{ deleted: boolean }>({ url: `/cart/items/${id}`, method: "DELETE" });
}

export function selectCartItem(id: string | number, selected: boolean) {
  return request<{ updated: boolean }>({ url: `/cart/items/${id}/selected`, method: "PATCH", data: { selected } });
}

export function selectCartItems(selected: boolean, itemIds?: Array<string | number>) {
  return request<{ updated: boolean }>({ url: "/cart/selection", method: "PATCH", data: { selected, itemIds } });
}

export function clearUnavailableCartItems() {
  return request<{ deleted: boolean }>({ url: "/cart/unavailable-items", method: "DELETE" });
}
