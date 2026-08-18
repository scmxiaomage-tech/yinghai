import { createOrder, fail, listOrders, response } from "../../_lib/sprint3-store";
export async function GET(request:Request){ const status=new URL(request.url).searchParams.get("status")??undefined; return response(listOrders(undefined,status)); }
export async function POST(request:Request){ try { return response(createOrder(await request.json()),"订单创建成功",201); } catch(error){ return fail(error instanceof Error?error.message:"订单创建失败"); } }
