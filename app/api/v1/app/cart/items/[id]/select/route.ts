import { fail, response, selectCart } from "../../../../../_lib/sprint3-store";
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){ try { const body=await request.json() as {selected?:boolean}; return response(selectCart((await params).id,Boolean(body.selected))); } catch(error){ return fail(error instanceof Error?error.message:"勾选失败"); } }
