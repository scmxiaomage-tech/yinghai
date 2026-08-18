import { adminRequest } from "./http";

export interface AdminOrderItem {
  id: string | number;
  productName: string;
  skuName: string;
  productImage?: string | null;
  unitPriceText: string;
  quantity: number;
  subtotalText: string;
}

export interface AdminOrderListItem {
  id: string | number;
  orderNo: string;
  status: "PENDING_PAYMENT" | "PAID" | "REFUNDING" | "REFUNDED" | "CANCELLED" | "CLOSED" | string;
  itemAmountText: string;
  payableAmountText: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  createdAt: string;
  expireAt: string;
  cancelReason?: string | null;
  items: AdminOrderItem[];
}

export type AdminOrderDetail = AdminOrderListItem;

export function getAdminOrders(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params);
  return adminRequest<{ page: number; pageSize: number; total: number; items: AdminOrderListItem[] }>({
    url: `/orders${query.toString() ? `?${query.toString()}` : ""}`
  });
}

export function getAdminOrderDetail(id: string | number) {
  return adminRequest<AdminOrderDetail>({ url: `/orders/${id}` });
}

export interface AdminPayment {
  id: string | number;
  paymentNo: string;
  orderId: string | number;
  orderNo: string;
  userId: string;
  provider: string;
  channel: string;
  status: "CREATED" | "PENDING" | "SUCCESS" | "CLOSED" | "FAILED" | string;
  amountText: string;
  currency: string;
  providerTradeNo?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

export function getAdminPayments(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params);
  return adminRequest<{ page: number; pageSize: number; total: number; items: AdminPayment[] }>({
    url: `/payments${query.toString() ? `?${query.toString()}` : ""}`
  });
}

export function getAdminPaymentDetail(id: string | number) {
  return adminRequest<AdminPayment & { events?: unknown[] }>({ url: `/payments/${id}` });
}

export interface AdminRefund {
  id: string | number;
  refundNo: string;
  orderId: string | number;
  orderNo: string;
  paymentId: string | number;
  paymentNo: string;
  userId: string;
  provider: string;
  providerRefundId?: string | null;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CLOSED" | string;
  amountText: string;
  currency: string;
  reason?: string | null;
  source: string;
  requestedBy: string;
  requestedAt: string;
  successAt?: string | null;
}

export function getAdminRefunds(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params);
  return adminRequest<{ page: number; pageSize: number; total: number; items: AdminRefund[] }>({
    url: `/refunds${query.toString() ? `?${query.toString()}` : ""}`
  });
}

export function getAdminRefundDetail(id: string | number) {
  return adminRequest<AdminRefund & { events?: unknown[] }>({ url: `/refunds/${id}` });
}

export function createAdminRefund(orderId: string | number, data: { reason?: string; provider?: "WECHAT_PAY" | "MOCK" }) {
  return adminRequest<AdminRefund>({ url: `/orders/${orderId}/refund`, method: "POST", data });
}
