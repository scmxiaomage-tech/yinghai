<template>
  <view class="page">
    <view class="member">
      <view class="avatar">迎</view>
      <view>
        <text class="level">迎海尊享会员</text>
        <text class="card">VIP卡号 8800 2186</text>
      </view>
      <button>设置</button>
    </view>

    <view class="wallet">
      <text class="label">我的余额</text>
      <text class="money">¥ 3680.00</text>
      <view class="wallet-actions">
        <button class="fill">充值</button>
        <button class="outline">提现</button>
      </view>
    </view>

    <view class="orders">
      <view class="section-row">
        <text class="section">我的订单</text>
        <text class="more" @click="goOrders('all')">全部订单 ›</text>
      </view>
      <view class="status">
        <text @click="goOrders('pending_payment')">待付款</text>
        <text>待配送</text>
        <text>待收货</text>
        <text>售后</text>
      </view>
    </view>

    <view class="grid">
      <view v-for="item in links" :key="item">{{ item }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
const links = ["地址管理", "优惠券", "积分记录", "分销中心", "佣金", "VIP权益", "礼品卡", "客服"];

function goOrders(status: string) {
  uni.navigateTo({ url: `/pages/order-list/index?status=${status}` });
}
</script>

<style scoped>
.page { min-height:100vh; padding:24rpx; background:#0b0b0a; color:#fffaf3; }
.member { display:flex; align-items:center; gap:18rpx; padding:26rpx; border-radius:30rpx; background:linear-gradient(135deg,#21170e,#0b0b0a 58%,#4a3215); border:1rpx solid rgba(231,184,91,.26); }
.avatar { display:grid; place-items:center; width:104rpx; height:104rpx; border-radius:28rpx; background:linear-gradient(135deg,#f3d485,#c89436); color:#17120b; font-size:42rpx; font-weight:900; }
.level { display:block; color:#f7dfaa; font-size:38rpx; font-weight:900; }
.card,.label { display:block; margin-top:8rpx; color:#b9ad95; }
.member button { margin-left:auto; width:120rpx; height:58rpx; line-height:58rpx; border-radius:999rpx; border:1rpx solid rgba(231,184,91,.7); background:transparent; color:#f3d485; font-size:22rpx; }
.wallet,.orders,.grid { margin-top:18rpx; padding:22rpx; border-radius:26rpx; background:#15120e; border:1rpx solid rgba(231,184,91,.14); }
.money { display:block; margin-top:14rpx; color:#f3d485; font-size:62rpx; font-weight:900; }
.wallet-actions { display:flex; gap:18rpx; justify-content:flex-end; margin-top:12rpx; }
.fill,.outline { width:128rpx; height:58rpx; line-height:58rpx; border-radius:999rpx; font-size:22rpx; font-weight:900; }
.fill { background:#e7b85b; color:#17120b; }
.outline { background:transparent; color:#f3d485; border:1rpx solid #e7b85b; }
.section-row { display:flex; justify-content:space-between; align-items:center; }
.section { font-size:30rpx; color:#f7dfaa; font-weight:900; }
.more { color:#d6a84b; font-size:24rpx; }
.status { display:grid; grid-template-columns:repeat(4,1fr); gap:10rpx; margin-top:16rpx; }
.status text,.grid view { padding:18rpx 6rpx; text-align:center; border-radius:18rpx; background:#211b13; color:#e7b85b; font-weight:800; }
.grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12rpx; }
</style>
