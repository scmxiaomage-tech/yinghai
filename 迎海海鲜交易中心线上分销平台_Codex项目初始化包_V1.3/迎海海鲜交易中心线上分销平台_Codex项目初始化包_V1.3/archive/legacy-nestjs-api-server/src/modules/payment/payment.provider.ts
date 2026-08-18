export type ProviderPayment = { paymentNo:string; amount:number; orderNo:string; userId:string };
export type ProviderResult = { status:"success"|"failed"|"pending"; transactionId?:string; prepayId?:string; raw?:Record<string, unknown> };
export interface PaymentProvider {
  createPayment(input: ProviderPayment): Promise<ProviderResult>;
  queryPayment(paymentNo:string): Promise<ProviderResult>;
  closePayment(paymentNo:string): Promise<void>;
  verifyPaymentNotification(input:unknown): Promise<ProviderResult & { paymentNo:string; amount:number }>;
  decryptPaymentNotification(input:unknown): Promise<unknown>;
  createRefund(input:{refundNo:string;paymentNo:string;amount:number}): Promise<ProviderResult>;
  queryRefund(refundNo:string): Promise<ProviderResult>;
  verifyRefundNotification(input:unknown): Promise<ProviderResult & { refundNo:string; amount:number }>;
  decryptRefundNotification(input:unknown): Promise<unknown>;
}
