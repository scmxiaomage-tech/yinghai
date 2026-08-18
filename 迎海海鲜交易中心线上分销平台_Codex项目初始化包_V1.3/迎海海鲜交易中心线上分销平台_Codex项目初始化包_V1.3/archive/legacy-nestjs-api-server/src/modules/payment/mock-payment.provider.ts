import { BadRequestException, Injectable } from "@nestjs/common";
import { PaymentProvider, ProviderPayment, ProviderResult } from "./payment.provider";
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private result(input: unknown): ProviderResult { const mode=(input as {mode?:string})?.mode ?? "PAY_PENDING"; if(mode==="PAY_FAILED"||mode==="REFUND_FAILED") return {status:"failed"}; if(mode==="PAY_SUCCESS"||mode==="REFUND_SUCCESS") return {status:"success",transactionId:`MOCK-${Date.now()}`}; return {status:"pending",prepayId:`mock_prepay_${Date.now()}`}; }
  async createPayment(input:ProviderPayment){ return this.result(input); } async queryPayment():Promise<ProviderResult>{return {status:"pending"};} async closePayment(){return;}
  async verifyPaymentNotification(input:unknown){ const p=input as {paymentNo:string;amount:number;mode?:string;signature?:string}; if(p.signature!=="mock-valid") throw new BadRequestException("Invalid mock signature"); return {...this.result(p),paymentNo:p.paymentNo,amount:p.amount}; }
  async decryptPaymentNotification(input:unknown){return input;} async createRefund(input:{refundNo:string;paymentNo:string;amount:number}){return this.result(input);} async queryRefund():Promise<ProviderResult>{return {status:"pending"};}
  async verifyRefundNotification(input:unknown){const p=input as {refundNo:string;amount:number;mode?:string;signature?:string};if(p.signature!=="mock-valid")throw new BadRequestException("Invalid mock signature");return {...this.result(p),refundNo:p.refundNo,amount:p.amount};} async decryptRefundNotification(input:unknown){return input;}
}
