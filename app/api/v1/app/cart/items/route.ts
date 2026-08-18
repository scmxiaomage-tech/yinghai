import { fail, response, upsertCart } from "../../../_lib/sprint3-store";
export async function POST(request:Request){ try { const body=await request.json() as {skuId?:string;quantity?:number}; return response(upsertCart(body.skuId??"",body.quantity??0),"已加入购物车",201); } catch(error){ return fail(error instanceof Error?error.message:"加入购物车失败"); } }
