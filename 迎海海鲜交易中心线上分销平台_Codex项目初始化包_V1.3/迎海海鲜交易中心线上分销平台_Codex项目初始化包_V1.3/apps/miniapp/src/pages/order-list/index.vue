<template>
  <view class="page">
    <view class="header"><text class="eyebrow">YINGHAI ORDERS</text><text class="title">我的订单</text></view>
    <view class="tabs"><button v-for="tab in tabs" :key="tab.value" :class="{ active: status === tab.value }" @click="switchTab(tab.value)">{{ tab.label }}</button></view>
    <view class="list">
      <view v-for="order in orders" :key="order.id" class="order" @click="goDetail(order.id)">
        <view class="top"><text>{{ order.orderNo }}</text><text>{{ statusText(order.status) }}</text></view>
        <text class="summary">{{ order.items?.map((item) => `${item.productName} x${item.quantity}`).join("，") || "订单商品" }}</text>
        <view class="meta"><text>{{ order.createdAt }}</text><strong>¥{{ order.payableAmountText }}</strong></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { getOrders, type OrderDetail } from "@/services/order";

const status = ref("all");
const tabs = [{ label: "全部", value: "all" }, { label: "待支付", value: "PENDING_PAYMENT" }, { label: "已支付", value: "PAID" }, { label: "退款", value: "REFUNDING" }, { label: "已退款", value: "REFUNDED" }];
const orders = ref<OrderDetail[]>([
  { id: "demo-1", orderNo: "YH202608160001", status: "PENDING_PAYMENT", itemAmountText: "1254.00", payableAmountText: "1254.00", receiverName: "陈先生", receiverPhone: "13800006688", receiverAddress: "上海市浦东新区", expireAt: "30分钟后", createdAt: "今天 10:28", items: [{ id: "1", productName: "鲜活深海帝王蟹", skuName: "3-6斤/只", unitPriceText: "998.00", quantity: 1, subtotalText: "998.00" }] }
]);

onLoad(async (query) => {
  if (typeof query?.status === "string") status.value = query.status;
  await loadOrders();
});

async function loadOrders() {
  try { orders.value = (await getOrders(status.value)).items; } catch { /* preview fallback */ }
}
async function switchTab(next: string) { status.value = next; await loadOrders(); }
function statusText(value: string) { return value === "PAID" ? "已支付" : value === "REFUNDING" ? "退款处理中" : value === "REFUNDED" ? "已退款" : value === "CANCELLED" ? "已取消" : value === "CLOSED" ? "已关闭" : "待支付"; }
function goDetail(id: string | number) { uni.navigateTo({ url: `/pages/order-detail/index?id=${id}` }); }
</script>

<style scoped>
.page{min-height:100vh;padding:24rpx;background:#f7f2ea;color:#17120b}.header{padding:28rpx;border-radius:34rpx;background:#11100e;color:#fffaf3}.eyebrow{display:block;color:#d6a84b;font-size:22rpx;letter-spacing:8rpx;font-weight:900}.title{display:block;margin-top:12rpx;font-size:52rpx;font-weight:900}.tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:10rpx;margin:20rpx 0}.tabs button{height:68rpx;line-height:68rpx;border-radius:999rpx;background:#fffdf8;color:#6f6658;font-size:24rpx;font-weight:900}.tabs .active{background:#17120b;color:#f4d27a}.list{display:grid;gap:16rpx}.order{padding:22rpx;border-radius:28rpx;background:#fffdf8;box-shadow:0 12rpx 28rpx rgba(31,24,15,.08)}.top,.meta{display:flex;justify-content:space-between;align-items:center}.top{font-size:24rpx;color:#806f55}.top text:last-child{color:#d88900;font-weight:900}.summary{display:block;margin:18rpx 0;font-size:30rpx;font-weight:900}.meta{color:#8b8275;font-size:24rpx}.meta strong{color:#d88900;font-size:34rpx}
</style>
