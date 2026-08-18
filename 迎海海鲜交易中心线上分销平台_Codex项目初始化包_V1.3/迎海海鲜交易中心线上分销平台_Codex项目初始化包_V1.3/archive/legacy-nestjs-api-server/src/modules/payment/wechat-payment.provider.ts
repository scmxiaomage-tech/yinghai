import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PaymentProvider, ProviderPayment, ProviderResult } from "./payment.provider";
@Injectable()
export class WechatPaymentProvider implements PaymentProvider {
  private unavailable():never { throw new ServiceUnavailableException("TODO_EXTERNAL_WECHAT_INTEGRATION: configure official WeChat Pay API v3 credentials and client"); }
  async createPayment(_:ProviderPayment):Promise<ProviderResult>{return this.unavailable();} async queryPayment(_:string):Promise<ProviderResult>{return this.unavailable();} async closePayment(_:string){return this.unavailable();} async verifyPaymentNotification(_:unknown){return this.unavailable();} async decryptPaymentNotification(_:unknown){return this.unavailable();} async createRefund(_: {refundNo:string;paymentNo:string;amount:number}):Promise<ProviderResult>{return this.unavailable();} async queryRefund(_:string):Promise<ProviderResult>{return this.unavailable();} async verifyRefundNotification(_:unknown){return this.unavailable();} async decryptRefundNotification(_:unknown){return this.unavailable();}
}
