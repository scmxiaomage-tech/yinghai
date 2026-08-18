<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">YINGHAI REWARDS</text>
      <text class="title">迎海积分商城</text>
      <text class="score">2,860</text>
      <text class="desc">尊享积分可兑换冷链券、会员礼遇与海鲜试吃装</text>
    </view>

    <view class="goods" v-for="item in goods" :key="item.name">
      <view class="photo">{{ item.icon }}</view>
      <view class="info">
        <text class="name">{{ item.name }}</text>
        <text class="meta">{{ item.meta }}</text>
        <text class="points">{{ item.points }} 积分</text>
      </view>
      <button>兑换</button>
    </view>
  </view>
</template>

<script setup lang="ts">
const goods = [
  { icon: "🎁", name: "尊享冷链保温袋", meta: "适用于礼盒配送", points: 580 },
  { icon: "🦪", name: "精品海鲜试吃券", meta: "会员专享兑换", points: 1280 },
  { icon: "🚚", name: "顺丰次日达运费券", meta: "单笔订单可用", points: 880 }
];
</script>

<style scoped>
.page { min-height:100vh; padding:24rpx; background:#0b0b0a; color:#fffaf3; }
.hero { padding:30rpx; border-radius:30rpx; background:linear-gradient(135deg,#21170e,#0b0b0a 55%,#5b3d16); border:1rpx solid rgba(231,184,91,.26); }
.eyebrow { display:block; color:#e7b85b; font-size:20rpx; letter-spacing:4rpx; font-weight:900; }
.title { display:block; margin-top:12rpx; font-size:44rpx; font-weight:900; }
.score { display:block; margin-top:22rpx; color:#f3d485; font-size:76rpx; font-weight:900; }
.desc { display:block; color:#9d9483; }
.goods { display:flex; align-items:center; gap:18rpx; margin-top:16rpx; padding:18rpx; border-radius:24rpx; background:#15120e; border:1rpx solid rgba(231,184,91,.14); }
.photo { display:grid; place-items:center; width:118rpx; height:118rpx; border-radius:22rpx; background:radial-gradient(circle,#5a3b18,#11100e); font-size:56rpx; }
.info { flex:1; }
.name { display:block; color:#f7dfaa; font-size:28rpx; font-weight:900; }
.meta { display:block; margin-top:8rpx; color:#9d9483; font-size:22rpx; }
.points { display:block; margin-top:8rpx; color:#e7b85b; font-weight:900; }
button { width:116rpx; height:58rpx; line-height:58rpx; border-radius:999rpx; background:#f3d485; color:#17120b; font-size:22rpx; font-weight:900; }
</style>
