import { cancelOrder, fail, response } from "../../../../_lib/sprint3-store";
export async function PUT(_request:Request,{params}:{params:Promise<{id:string}>}){ try { return response(cancelOrder((await params).id),"订单已取消"); } catch(error){ return fail(error instanceof Error?error.message:"取消订单失败"); } }
