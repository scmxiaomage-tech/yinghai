<template>
  <view class="page">
    <view class="hero"><text class="eyebrow">ORDER CONFIRM</text><text class="title">确认订单</text><text class="sub">服务端实时校验价格与库存</text></view>
    <view class="card address">
      <text class="tag">收货信息</text>
      <input v-model="receiverName" placeholder="收货人" />
      <input v-model="receiverPhone" placeholder="手机号" />
      <textarea v-model="receiverAddress" placeholder="详细收货地址" />
    </view>
    <view class="card">
      <text class="tag">商品清单</text>
      <view v-for="item in preview.items" :key="item.skuId" class="goods">
        <image :src="item.productImage || fallbackImage" mode="aspectFill" />
        <view><text class="name">{{ item.productName }}</text><text class="sku">{{ item.skuName }} · 库存 {{ item.availableStock }}</text><text class="price">¥{{ item.unitPriceText }} × {{ item.quantity }}</text></view>
      </view>
    </view>
    <view class="card fee">
      <view><text>商品金额</text><text>¥{{ preview.itemAmountText }}</text></view>
      <view><text>配送费</text><text>¥0.00</text></view>
      <view><text>优惠金额</text><text>¥0.00</text></view>
      <view class="payable"><text>应付金额</text><text>¥{{ preview.payableAmountText }}</text></view>
    </view>
    <view class="card"><text class="tag">买家留言</text><textarea v-model="buyerRemark" placeholder="忌口、送达时间、收货提醒" /></view>
    <view class="bottom"><view><text>待支付</text><strong>¥{{ preview.payableAmountText }}</strong></view><button @click="submitOrder">提交订单</button></view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { createOrder, previewOrder, type OrderPreview } from "@/services/order";

const fallbackImage = "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80";
const receiverName = ref("陈先生");
const receiverPhone = ref("13800006688");
const receiverAddress = ref("上海市浦东新区陆家嘴海鲜冷链示范区 8 号仓");
const buyerRemark = ref("");
const requestId = ref(`REQ-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const items = ref([{ skuId: "1", quantity: 1 }]);
const preview = ref<OrderPreview>({ items: [{ productId: "1", skuId: "1", productName: "鲜活深海帝王蟹", skuName: "3-6斤/只", productImage: fallbackImage, unitPrice: 99800, unitPriceText: "998.00", quantity: 1, subtotal: 99800, subtotalText: "998.00", availableStock: 28, available: true }], itemAmount: 99800, discountAmount: 0, shippingAmount: 0, payableAmount: 99800, itemAmountText: "998.00", payableAmountText: "998.00", priceSnapshot: "demo" });

onLoad(async (query) => {
  const skuId = typeof query?.skuId === "string" ? query.skuId : "1";
  const quantity = Number(typeof query?.quantity === "string" ? query.quantity : 1) || 1;
  items.value = [{ skuId, quantity }];
  try { preview.value = await previewOrder({ items: items.value }); } catch { /* preview fallback */ }
});

async function submitOrder() {
  try {
    const order = await createOrder({ items: items.value, receiverName: receiverName.value, receiverPhone: receiverPhone.value, receiverAddress: receiverAddress.value, buyerRemark: buyerRemark.value, requestId: requestId.value, priceSnapshot: preview.value.priceSnapshot });
    uni.redirectTo({ url: `/pages/order-detail/index?id=${order.id}` });
  } catch (error) {
    uni.showToast({ title: error instanceof Error && error.message.includes("PRICE") ? "价格变化，请重新确认" : "提交失败，请稍后再试", icon: "none" });
  }
}
</script>

<style scoped>
.page{min-height:100vh;padding:24rpx 24rpx 150rpx;background:#f7f2ea;color:#17120b}.hero{padding:30rpx;border-radius:34rpx;background:linear-gradient(135deg,#11100e,#322411);color:#fffaf3}.eyebrow{display:block;color:#d6a84b;font-size:22rpx;letter-spacing:8rpx;font-weight:900}.title{display:block;margin-top:12rpx;font-size:54rpx;font-weight:900}.sub{display:block;margin-top:8rpx;color:#cfc3aa;font-size:24rpx}.card{margin-top:18rpx;padding:24rpx;border-radius:30rpx;background:#fffdf8;box-shadow:0 14rpx 34rpx rgba(31,24,15,.08)}.tag{display:inline-block;margin-bottom:14rpx;padding:6rpx 14rpx;border-radius:999rpx;background:#17120b;color:#f4d27a;font-size:22rpx;font-weight:900}input,textarea{display:block;width:100%;margin-top:12rpx;padding:18rpx;box-sizing:border-box;border-radius:22rpx;background:#f7f2ea}.goods{display:flex;gap:18rpx;padding:18rpx 0;border-bottom:1rpx solid #eee4d5}.goods:last-child{border-bottom:0}.goods image{width:160rpx;height:130rpx;border-radius:22rpx}.name{display:block;font-size:30rpx;font-weight:900}.sku{display:block;margin-top:8rpx;color:#786d5d;font-size:24rpx}.price{display:block;margin-top:14rpx;color:#d88900;font-size:30rpx;font-weight:900}.fee view{display:flex;justify-content:space-between;padding:12rpx 0;color:#6f6658}.fee .payable{color:#17120b;font-size:34rpx;font-weight:900}.bottom{position:fixed;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:18rpx 24rpx 34rpx;background:#fffdf8;box-shadow:0 -12rpx 30rpx rgba(0,0,0,.08)}.bottom text{display:block;color:#766d5e;font-size:22rpx}.bottom strong{color:#d88900;font-size:42rpx}.bottom button{width:300rpx;height:82rpx;line-height:82rpx;border-radius:999rpx;border:0;background:linear-gradient(135deg,#f2d182,#c5902f);color:#17120b;font-size:30rpx;font-weight:900}
</style>
