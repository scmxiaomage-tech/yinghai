import { response, selectAll } from "../../../_lib/sprint3-store";
export async function PUT(request:Request){ const body=await request.json() as {selected?:boolean}; selectAll(Boolean(body.selected)); return response(null,"已批量更新"); }
