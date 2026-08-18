import { request } from "./http";

export interface OrderItemInput {
  skuId: string | number;
  quantity: number;
}

export interface CreatePaymentInput {
  provider: "WECHAT_PAY" | "MOCK";
  clientRequestId?: string;
}

export interface PaymentResult {
  id: string | number;
  paymentNo: string;
  orderId: string | number;
  orderNo: string;
  provider: string;
  status: "CREATED" | "PENDING" | "SUCCESS" | "CLOSED" | "FAILED" | string;
  amount: number;
  amountText: string;
  currency: string;
  clientParams?: Record<string, string>;
}

export interface PaymentStatus {
  orderId: string | number;
  orderNo: string;
  orderStatus: string;
  payment?: PaymentResult;
}

export interface RefundResult {
  id: string | number;
  refundNo: string;
  orderId: string | number;
  orderNo: string;
  paymentId: string | number;
  paymentNo: string;
  provider: string;
  providerRefundId?: string | null;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CLOSED" | string;
  amount: number;
  amountText: string;
  currency: string;
  reason?: string | null;
  source: string;
  requestedAt: string;
  successAt?: string | null;
}

export function createPayment(id: string | number, data: CreatePaymentInput) {
  return request<PaymentResult>({ url: `/orders/${id}/payments`, method: "POST", data });
}

export function getPaymentStatus(id: string | number) {
  return request<PaymentStatus>({ url: `/orders/${id}/payment-status` });
}

export function getRefund(id: string | number) {
  return request<RefundResult>({ url: `/refunds/${id}` });
}

export function getOrderRefund(id: string | number) {
  return request<RefundResult>({ url: `/orders/${id}/refund` });
}

export interface PreviewOrderInput {
  items: OrderItemInput[];
}

export interface CreateOrderInput extends PreviewOrderInput {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  buyerRemark?: string;
  requestId: string;
  priceSnapshot: string;
}

export interface PreviewItem {
  productId: string | number;
  skuId: string | number;
  productName: string;
  skuName: string;
  productImage?: string | null;
  unitPrice: number;
  unitPriceText: string;
  quantity: number;
  subtotal: number;
  subtotalText: string;
  availableStock: number;
  available: boolean;
  unavailableReason?: string | null;
}

export interface OrderPreview {
  items: PreviewItem[];
  itemAmount: number;
  discountAmount: number;
  shippingAmount: number;
  payableAmount: number;
  itemAmountText: string;
  payableAmountText: string;
  priceSnapshot: string;
}

export interface OrderItem {
  id: string | number;
  productName: string;
  skuName: string;
  productImage?: string | null;
  unitPriceText: string;
  quantity: number;
  subtotalText: string;
}

export interface OrderDetail {
  id: string | number;
  orderNo: string;
  status: "PENDING_PAYMENT" | "PAID" | "REFUNDING" | "REFUNDED" | "CANCELLED" | "CLOSED" | string;
  itemAmountText: string;
  payableAmountText: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  buyerRemark?: string | null;
  cancelReason?: string | null;
  expireAt: string;
  createdAt: string;
  items: OrderItem[];
}

export function previewOrder(data: PreviewOrderInput) {
  return request<OrderPreview>({ url: "/orders/preview", method: "POST", data });
}

export function createOrder(data: CreateOrderInput) {
  return request<OrderDetail>({ url: "/orders", method: "POST", data });
}

export function getOrders(status = "all", page = 1, pageSize = 20) {
  return request<{ page: number; pageSize: number; total: number; items: OrderDetail[] }>({
    url: `/orders?status=${encodeURIComponent(status)}&page=${page}&pageSize=${pageSize}`
  });
}

export function getOrderDetail(id: string | number) {
  return request<OrderDetail>({ url: `/orders/${id}` });
}

export function cancelOrder(id: string | number, cancelReason = "用户取消订单") {
  return request<OrderDetail>({ url: `/orders/${id}/cancel`, method: "POST", data: { cancelReason } });
}
