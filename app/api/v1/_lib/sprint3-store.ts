import { randomUUID } from "crypto";

export type OrderStatus = "pending_payment" | "paid" | "preparing" | "delivering" | "completed" | "cancelled" | "after_sale";
export type PaymentStatus = "unpaid" | "paid" | "refunding" | "refunded";
export type CartRow = { id:string; userId:string; skuId:string; quantity:number; selected:boolean; createdAt:string; updatedAt:string; deletedAt?:string };
export type OrderLine = { id:string; productId:string; skuId:string; productName:string; skuName:string; skuCode:string; mainImageUrl:string; unitPrice:number; quantity:number; subtotalAmount:number };
export type Order = { id:string; orderNo:string; userId:string; addressId:string; receiverName:string; receiverPhone:string; province:string; city:string; district:string; detailAddress:string; longitude?:number; latitude?:number; goodsAmount:number; discountAmount:number; deliveryFee:number; payableAmount:number; paidAmount:number; orderStatus:OrderStatus; paymentStatus:PaymentStatus; remark?:string; deliveryRiskConfirmed:boolean; createdAt:string; updatedAt:string; cancelledAt?:string; items:OrderLine[] };

type Product = { id:string; skuId:string; skuCode:string; name:string; skuName:string; price:number; stock:number; status:"enabled"|"disabled"; shelfStatus:"on_sale"|"off_sale"; image:string };
const products:Product[] = [
  { id:"p-king-crab", skuId:"sku-king-crab", skuCode:"YH-KC-001", name:"鲜活深海帝王蟹", skuName:"3–6斤/只", price:998, stock:20, status:"enabled", shelfStatus:"on_sale", image:"/assets/seafood-skus/sku-1.jpg" },
  { id:"p-lobster", skuId:"sku-lobster", skuCode:"YH-LB-002", name:"波士顿龙虾", skuName:"450–550g/只", price:128, stock:86, status:"enabled", shelfStatus:"on_sale", image:"/assets/seafood-skus/sku-2.jpg" },
  { id:"p-swimming-crab", skuId:"sku-swimming-crab", skuCode:"YH-SC-003", name:"鲜活梭子蟹", skuName:"鲜活现发", price:198, stock:68, status:"enabled", shelfStatus:"on_sale", image:"/assets/seafood-skus/sku-3.jpg" },
  { id:"p-mitten-crab", skuId:"sku-mitten-crab", skuCode:"YH-MC-004", name:"阳澄湖大闸蟹", skuName:"公母可选", price:298, stock:45, status:"enabled", shelfStatus:"on_sale", image:"/assets/seafood-skus/sku-4.jpg" },
  { id:"p-green-crab", skuId:"sku-green-crab", skuCode:"YH-GC-005", name:"鲜活青蟹", skuName:"鲜活冷链", price:168, stock:60, status:"enabled", shelfStatus:"on_sale", image:"/assets/seafood-skus/sku-5.jpg" },
  { id:"p-sold-out", skuId:"sku-sold-out", skuCode:"YH-TEST-006", name:"测试缺货商品", skuName:"测试规格", price:99, stock:0, status:"enabled", shelfStatus:"on_sale", image:"/assets/seafood-skus/sku-6.jpg" },
];
const address = { id:"address-demo-001", receiverName:"陈先生", receiverPhone:"13866886688", province:"上海市", city:"上海市", district:"浦东新区", detailAddress:"华夏东路685号8幢206室", longitude:121.56789, latitude:31.22999 };

const memory = globalThis as typeof globalThis & { __sprint3Store?:{ cart:CartRow[]; orders:Order[] } };
const store = memory.__sprint3Store ?? (memory.__sprint3Store = { cart:[], orders:[] });
const now = () => new Date().toISOString();
const round = (amount:number) => Math.round((amount + Number.EPSILON) * 100) / 100;
export const demoUserId = "user-demo-001";

export function response(data:unknown, message="ok", status=200){ return Response.json({ code:0, message, data }, { status }); }
export function fail(message:string, status=400){ return Response.json({ code:status, message, data:null }, { status }); }
export function getProduct(skuId:string){ return products.find((product)=>product.skuId===skuId); }
export function productCatalog(){ return products.map(({stock, ...item})=>({...item, availableStock:stock})); }
export function getCart(userId=demoUserId){ return store.cart.filter((row)=>row.userId===userId&&!row.deletedAt).map((row)=>({ ...row, product:getProduct(row.skuId) })); }
export function upsertCart(skuId:string, quantity:number, userId=demoUserId){
  const product=getProduct(skuId); if(!product) throw new Error("SKU不存在"); if(product.status!=="enabled") throw new Error("SKU已失效"); if(product.shelfStatus!=="on_sale") throw new Error("商品已下架"); if(!Number.isInteger(quantity)||quantity<=0) throw new Error("购买数量必须大于0");
  const existing=store.cart.find((row)=>row.userId===userId&&row.skuId===skuId&&!row.deletedAt); const timestamp=now();
  if(existing){ existing.quantity+=quantity; existing.updatedAt=timestamp; return existing; }
  const row={id:randomUUID(),userId,skuId,quantity,selected:true,createdAt:timestamp,updatedAt:timestamp}; store.cart.push(row); return row;
}
export function updateCart(id:string, quantity:number, userId=demoUserId){ const row=store.cart.find((item)=>item.id===id&&item.userId===userId&&!item.deletedAt); if(!row) throw new Error("购物车商品不存在"); if(!Number.isInteger(quantity)||quantity<=0) throw new Error("购买数量必须大于0"); row.quantity=quantity; row.updatedAt=now(); return row; }
export function deleteCart(id:string, userId=demoUserId){ const row=store.cart.find((item)=>item.id===id&&item.userId===userId&&!item.deletedAt); if(!row) throw new Error("购物车商品不存在"); row.deletedAt=now(); row.updatedAt=row.deletedAt; }
export function selectCart(id:string, selected:boolean, userId=demoUserId){ const row=store.cart.find((item)=>item.id===id&&item.userId===userId&&!item.deletedAt); if(!row) throw new Error("购物车商品不存在"); row.selected=selected; row.updatedAt=now(); return row; }
export function selectAll(selected:boolean, userId=demoUserId){ getCart(userId).forEach((row)=>selectCart(row.id,selected,userId)); }

type CreatePayload={ addressId:string; items:Array<{skuId:string;quantity:number}>; remark?:string; deliveryRiskConfirmed?:boolean };
function validate(payload:CreatePayload){
  if(payload.addressId!==address.id) throw new Error("收货地址不存在或无权使用");
  if(!payload.items?.length) throw new Error("请至少选择一件商品");
  const lines=payload.items.map(({skuId,quantity})=>{ const product=getProduct(skuId); if(!product) throw new Error("SKU不存在"); if(product.status!=="enabled") throw new Error(`${product.name} SKU已失效`); if(product.shelfStatus!=="on_sale") throw new Error(`${product.name} 已下架`); if(!Number.isInteger(quantity)||quantity<=0) throw new Error("购买数量必须大于0"); if(product.stock<quantity) throw new Error(`${product.name} 库存不足`); return { product, quantity }; });
  // Sprint3 delivery policy: this demo address is in range; range config can be expanded in Sprint4.
  const inRange=address.city==="上海市"; if(!inRange&&!payload.deliveryRiskConfirmed) throw new Error("当前地址超出配送范围，请确认配送风险后再提交");
  const goodsAmount=round(lines.reduce((sum,line)=>sum+line.product.price*line.quantity,0)); const deliveryFee=goodsAmount>=199?0:20;
  return { lines, goodsAmount, deliveryFee, payableAmount:round(goodsAmount+deliveryFee) };
}
export function previewOrder(payload:CreatePayload){ const result=validate(payload); return {...result,address,discountAmount:0,paidAmount:0,deliveryRiskRequired:false}; }
export function createOrder(payload:CreatePayload,userId=demoUserId){ const calculated=validate(payload); const timestamp=now(); const id=randomUUID(); const orderNo=`YH${timestamp.replace(/[-:.TZ]/g,"").slice(0,14)}${Math.floor(Math.random()*9000+1000)}`; const order:Order={id,orderNo,userId,addressId:address.id,receiverName:address.receiverName,receiverPhone:address.receiverPhone,province:address.province,city:address.city,district:address.district,detailAddress:address.detailAddress,longitude:address.longitude,latitude:address.latitude,goodsAmount:calculated.goodsAmount,discountAmount:0,deliveryFee:calculated.deliveryFee,payableAmount:calculated.payableAmount,paidAmount:0,orderStatus:"pending_payment",paymentStatus:"unpaid",remark:payload.remark?.slice(0,255),deliveryRiskConfirmed:Boolean(payload.deliveryRiskConfirmed),createdAt:timestamp,updatedAt:timestamp,items:calculated.lines.map(({product,quantity})=>({id:randomUUID(),productId:product.id,skuId:product.skuId,productName:product.name,skuName:product.skuName,skuCode:product.skuCode,mainImageUrl:product.image,unitPrice:product.price,quantity,subtotalAmount:round(product.price*quantity)}))};
  store.orders.unshift(order); payload.items.forEach(({skuId})=>{ const cartRow=store.cart.find((row)=>row.userId===userId&&row.skuId===skuId&&!row.deletedAt); if(cartRow) deleteCart(cartRow.id,userId); }); return order;
}
export function listOrders(userId=demoUserId,status?:string){ return store.orders.filter((order)=>order.userId===userId&&(!status||order.orderStatus===status)); }
export function getOrder(id:string,userId?:string){ return store.orders.find((order)=>order.id===id&&(!userId||order.userId===userId)); }
export function cancelOrder(id:string,userId=demoUserId){ const order=getOrder(id,userId); if(!order) throw new Error("订单不存在"); if(order.orderStatus!=="pending_payment") throw new Error("当前订单不能取消"); order.orderStatus="cancelled"; order.cancelledAt=now(); order.updatedAt=order.cancelledAt; return order; }
export function listAdminOrders(){ return store.orders; }
