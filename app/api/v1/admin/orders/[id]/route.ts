import { fail, getOrder, response } from "../../../_lib/sprint3-store";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){ const order=getOrder((await params).id); return order?response(order):fail("订单不存在",404); }
