import { getCart, response } from "../../_lib/sprint3-store";
export async function GET(){ return response(getCart()); }
