<template>
  <view class="page">
    <view class="header">
      <view>
        <text class="eyebrow">MESSAGE CENTER</text>
        <text class="title">消息中心</text>
      </view>
      <button>全部已读</button>
    </view>

    <view class="summary">
      <text class="count">3</text>
      <text>条未读消息</text>
    </view>

    <view class="tabs">
      <text class="active">全部</text>
      <text>订单</text>
      <text>物流</text>
      <text>佣金</text>
      <text>活动</text>
    </view>

    <view v-for="item in messages" :key="item.title" class="msg">
      <view class="icon">{{ item.icon }}</view>
      <view class="content">
        <view class="row">
          <text class="msg-title">{{ item.title }}</text>
          <text class="time">{{ item.time }}</text>
        </view>
        <text class="desc">{{ item.desc }}</text>
        <text class="tag">{{ item.tag }}</text>
      </view>
      <text v-if="item.unread" class="dot"></text>
    </view>
  </view>
</template>

<script setup lang="ts">
const messages = [
  { icon: "运", title: "礼品卡实体卡已发货", desc: "顺丰速运已揽收，预计明日送达。", tag: "物流通知", time: "10:26", unread: true },
  { icon: "佣", title: "推广佣金已到账", desc: "一级推广佣金 ¥47.04 已转入账户余额。", tag: "佣金通知", time: "09:18", unread: true },
  { icon: "促", title: "迎海会员礼节限时开启", desc: "VIP会员购享指定生鲜商品尊享上折。", tag: "活动通知", time: "昨天", unread: false }
];
</script>

<style scoped>
.page { min-height:100vh; padding:24rpx; background:#0b0b0a; color:#fffaf3; }
.header,.row { display:flex; align-items:center; justify-content:space-between; }
.header { padding:26rpx 24rpx; border-radius:28rpx; background:linear-gradient(135deg,#201811,#0f0d0a); border:1rpx solid rgba(231,184,91,.22); }
.eyebrow { display:block; color:#e7b85b; font-size:20rpx; letter-spacing:4rpx; font-weight:900; }
.title { display:block; margin-top:10rpx; font-size:44rpx; font-weight:900; }
.header button { width:150rpx; height:58rpx; line-height:58rpx; border-radius:999rpx; background:#f3d485; color:#17120b; font-weight:900; font-size:22rpx; }
.summary { display:flex; align-items:center; gap:14rpx; margin:18rpx 0; padding:18rpx 24rpx; border-radius:22rpx; background:#fffaf3; color:#3b2d1b; }
.count { color:#c89436; font-size:48rpx; font-weight:900; }
.tabs { display:grid; grid-template-columns:repeat(5,1fr); gap:8rpx; margin-bottom:18rpx; padding:10rpx; border-radius:22rpx; background:#15120e; }
.tabs text { padding:14rpx 0; text-align:center; border-radius:16rpx; color:#9d9483; font-weight:800; }
.tabs .active { color:#17120b; background:#e7b85b; }
.msg { position:relative; display:flex; gap:18rpx; margin-bottom:16rpx; padding:20rpx; border-radius:24rpx; background:#15120e; border:1rpx solid rgba(231,184,91,.14); }
.icon { display:grid; place-items:center; width:82rpx; height:82rpx; border-radius:20rpx; background:linear-gradient(135deg,#e7b85b,#9f6b1d); color:#17120b; font-weight:900; }
.content { flex:1; }
.msg-title { font-size:28rpx; color:#f7dfaa; font-weight:900; }
.time,.desc { color:#9d9483; font-size:22rpx; }
.desc { display:block; margin-top:10rpx; }
.tag { display:inline-block; margin-top:14rpx; color:#e7b85b; font-size:22rpx; }
.dot { position:absolute; top:20rpx; right:20rpx; width:14rpx; height:14rpx; border-radius:50%; background:#d64235; }
</style>
