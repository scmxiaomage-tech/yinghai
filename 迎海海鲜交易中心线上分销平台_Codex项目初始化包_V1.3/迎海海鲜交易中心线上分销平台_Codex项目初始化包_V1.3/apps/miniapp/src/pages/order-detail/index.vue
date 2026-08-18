<template>
  <view class="page">
    <view class="status"><text class="eyebrow">ORDER DETAIL</text><text class="title">{{ statusText(order.status) }}</text><text class="desc">订单、支付、退款状态均以服务端确认为准，前端支付回调不直接改 PAID</text></view>
    <view class="card"><text class="tag">订单信息</text><view class="row"><text>订单号</text><strong>{{ order.orderNo }}</strong></view><view class="row"><text>创建时间</text><strong>{{ order.createdAt }}</strong></view><view class="row"><text>有效期</text><strong>{{ order.expireAt }}</strong></view><view class="row"><text>应付金额</text><strong>¥{{ order.payableAmountText }}</strong></view></view>
    <view class="card"><text class="tag">地址快照</text><text class="addr">{{ order.receiverName }} {{ order.receiverPhone }}</text><text class="addr sub">{{ order.receiverAddress }}</text></view>
    <view class="card"><text class="tag">商品快照</text><view v-for="item in order.items" :key="item.id" class="goods"><image :src="item.productImage || fallbackImage" mode="aspectFill" /><view><text class="name">{{ item.productName }}</text><text class="sub">{{ item.skuName }}</text><text class="price">¥{{ item.unitPriceText }} × {{ item.quantity }}</text></view></view></view>
    <view class="bottom"><button v-if="order.status === 'PENDING_PAYMENT'" class="ghost" @click="cancel">取消订单</button><button v-if="order.status === 'PENDING_PAYMENT'" class="pay" @click="payNow">立即支付</button><button v-else class="pay" @click="refreshPayment">刷新状态</button></view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { cancelOrder, createPayment, getOrderDetail, getPaymentStatus, type OrderDetail } from "@/services/order";

const fallbackImage = "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80";
const order = ref<OrderDetail>({ id: "demo-1", orderNo: "YH202608160001", status: "PENDING_PAYMENT", itemAmountText: "998.00", payableAmountText: "998.00", receiverName: "陈先生", receiverPhone: "13800006688", receiverAddress: "上海市浦东新区陆家嘴海鲜冷链示范区 8 号仓", expireAt: "30分钟后", createdAt: "今天 10:28", items: [{ id: "1", productName: "鲜活深海帝王蟹", skuName: "3-6斤/只 原产海域暂养直发", productImage: fallbackImage, unitPriceText: "998.00", quantity: 1, subtotalText: "998.00" }] });
const orderId = ref<string | number>("demo-1");

onLoad(async (query) => {
  if (typeof query?.id === "string") orderId.value = query.id;
  try { order.value = await getOrderDetail(orderId.value); } catch { /* preview fallback */ }
});

function statusText(value: string) { return value === "PAID" ? "已支付" : value === "REFUNDING" ? "退款处理中" : value === "REFUNDED" ? "已退款" : value === "CANCELLED" ? "已取消" : value === "CLOSED" ? "已关闭" : "待支付"; }
async function cancel() {
  try { order.value = await cancelOrder(orderId.value); uni.showToast({ title: "订单已取消", icon: "none" }); } catch { uni.showToast({ title: "取消失败，请刷新订单", icon: "none" }); }
}
async function payNow() {
  try {
    const payment = await createPayment(orderId.value, { provider: "WECHAT_PAY", clientRequestId: `pay-${Date.now()}` });
    console.log("payment client params", payment.clientParams);
    uni.showToast({ title: "正在确认支付结果", icon: "none" });
    await refreshPayment();
  } catch { uni.showToast({ title: "支付创建失败，请稍后重试", icon: "none" }); }
}
async function refreshPayment() {
  try {
    const result = await getPaymentStatus(orderId.value);
    if (result.orderStatus === "PAID") order.value = await getOrderDetail(orderId.value);
    uni.showToast({ title: result.orderStatus === "PAID" ? "支付成功" : "支付结果确认中", icon: "none" });
  } catch { uni.showToast({ title: "支付状态查询失败", icon: "none" }); }
}
</script>

<style scoped>
.page{min-height:100vh;padding:24rpx 24rpx 150rpx;background:#f7f2ea;color:#17120b}.status{padding:30rpx;border-radius:34rpx;background:linear-gradient(135deg,#11100e,#322411);color:#fffaf3}.eyebrow{display:block;color:#d6a84b;font-size:22rpx;letter-spacing:8rpx;font-weight:900}.title{display:block;margin-top:12rpx;font-size:54rpx;font-weight:900}.desc{display:block;margin-top:8rpx;color:#cfc3aa;font-size:24rpx}.card{margin-top:18rpx;padding:24rpx;border-radius:30rpx;background:#fffdf8;box-shadow:0 14rpx 34rpx rgba(31,24,15,.08)}.tag{display:inline-block;margin-bottom:14rpx;padding:6rpx 14rpx;border-radius:999rpx;background:#17120b;color:#f4d27a;font-size:22rpx;font-weight:900}.row{display:flex;justify-content:space-between;padding:12rpx 0;color:#70685c}.row strong{color:#17120b}.addr,.sub{display:block;font-size:30rpx;font-weight:900}.sub{margin-top:8rpx;color:#786d5d;font-size:24rpx;font-weight:500}.goods{display:flex;gap:18rpx;padding:16rpx 0;border-bottom:1rpx solid #eee4d5}.goods:last-child{border-bottom:0}.goods image{width:160rpx;height:130rpx;border-radius:22rpx}.name{display:block;font-size:30rpx;font-weight:900}.sub{display:block}.price{display:block;margin-top:12rpx;color:#d88900;font-size:30rpx;font-weight:900}.bottom{position:fixed;left:0;right:0;bottom:0;display:flex;gap:16rpx;padding:18rpx 24rpx 34rpx;background:#fffdf8;box-shadow:0 -12rpx 30rpx rgba(0,0,0,.08)}.ghost,.pay{flex:1;height:76rpx;line-height:76rpx;border-radius:999rpx;font-size:28rpx;font-weight:900}.ghost{background:#17120b;color:#f4d27a}.pay{background:linear-gradient(135deg,#f2d182,#c5902f);color:#17120b}
</style>
