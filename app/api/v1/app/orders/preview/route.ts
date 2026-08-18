import { fail, previewOrder, response } from "../../../_lib/sprint3-store";
export async function POST(request:Request){ try { return response(previewOrder(await request.json())); } catch(error){ return fail(error instanceof Error?error.message:"订单预览失败"); } }
