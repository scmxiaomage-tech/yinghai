<template>
  <view class="page">
    <view class="visual-title">
      <text class="scheme">方案四｜高端 尊享风</text>
      <text class="subtitle">高端大气 · 尊享体验</text>
    </view>

    <view class="miniapp-shell">
      <view class="status-row">
        <text>9:41</text>
        <view class="signal"><text></text><text></text><text></text><view></view></view>
      </view>

      <view class="native-top">
        <view class="location"><text class="pin-icon"></text><text>迎海海鲜交易中心</text></view>
        <view class="capsule"><text></text><text></text><text></text><view class="ring"></view></view>
      </view>

      <view class="search"><text class="search-icon"></text><text>搜索商品</text></view>

      <view class="banner">
        <view class="banner-copy">
          <text class="banner-title">尊享品质 海味臻选</text>
          <text class="banner-sub">甄选全球优质海鲜</text>
          <button class="banner-btn">立即选购</button>
        </view>
        <view class="seafood lobster"></view>
        <view class="seafood abalone"></view>
      </view>

      <view class="quick-panel">
        <view v-for="item in quickLinks" :key="item.name" class="quick-item">
          <view class="quick-icon" :class="item.icon"></view>
          <text>{{ item.name }}</text>
        </view>
      </view>

      <view class="dark-card flash">
        <view class="section-head">
          <view class="section-left">
            <text class="section-title">尊享秒杀</text>
            <view class="countdown"><text>02</text><text>18</text><text>45</text></view>
          </view>
          <text class="more">更多 ›</text>
        </view>
        <scroll-view scroll-x class="flash-scroll">
          <view v-for="item in flashItems" :key="item.name" class="flash-item" @click="openDetail(item.id)">
            <view class="product-img" :class="item.imageClass"><text class="vip">VIP尊享</text></view>
            <text class="product-name">{{ item.name }}</text>
            <view class="price-line"><text class="currency">¥</text><text class="price">{{ item.price }}</text></view>
            <text class="old">¥{{ item.oldPrice }}</text>
          </view>
        </scroll-view>
      </view>

      <view class="dark-card recommend">
        <view class="section-head"><text class="section-title">臻选推荐</text><text class="more">更多 ›</text></view>
        <view class="recommend-grid">
          <view v-for="(item, index) in recommendItems" :key="index" class="recommend-item" @click="openDetail(item.id)">
            <view class="recommend-img" :class="item.imageClass"></view>
          </view>
        </view>
      </view>
    </view>

    <view class="palette"><text>主色调</text><view class="dot gold"></view><view class="dot black"></view><view class="dot tan"></view><view class="dot gray"></view><view class="dot light"></view></view>
    <text class="keywords">设计关键词：高端、尊享、品质、信任</text>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getCategories, getProducts, getRecommendedProducts, type ProductListItem } from "@/services/product";

type DisplayProduct = { id: string; imageClass: string; name: string; price: string; oldPrice: string };

const quickLinks = ref([
  { icon: "icon-grid", name: "全部分类" },
  { icon: "icon-flash", name: "秒杀专区" },
  { icon: "icon-group", name: "拼团活动" },
  { icon: "icon-coupon", name: "优惠券" },
  { icon: "icon-member", name: "会员中心" }
]);

const flashItems = ref<DisplayProduct[]>([
  { id: "demo-oyster", imageClass: "photo-oyster", name: "深海生蚝", price: "158.00", oldPrice: "198.00" },
  { id: "demo-lobster", imageClass: "photo-lobster", name: "波士顿龙虾", price: "258.00", oldPrice: "298.00" },
  { id: "demo-abalone", imageClass: "photo-abalone", name: "活鲍礼盒", price: "128.00", oldPrice: "168.00" },
  { id: "demo-salmon", imageClass: "photo-salmon", name: "冰鲜刺身", price: "198.00", oldPrice: "228.00" }
]);

const recommendItems = ref<DisplayProduct[]>([
  { id: "demo-lobster", imageClass: "photo-lobster", name: "波士顿龙虾", price: "258.00", oldPrice: "298.00" },
  { id: "demo-crab", imageClass: "photo-crab", name: "珍宝蟹", price: "198.00", oldPrice: "298.00" },
  { id: "demo-abalone", imageClass: "photo-abalone", name: "深海鲍鱼", price: "128.00", oldPrice: "168.00" },
  { id: "demo-salmon", imageClass: "photo-salmon", name: "刺身拼盘", price: "198.00", oldPrice: "228.00" }
]);

onMounted(async () => {
  try {
    const [categories, products, recommended] = await Promise.all([
      getCategories(),
      getProducts({ page: 1, pageSize: 8, sort: "default" }),
      getRecommendedProducts()
    ]);
    if (categories.length) {
      quickLinks.value = categories.slice(0, 5).map((item, index) => ({
        icon: ["icon-grid", "icon-flash", "icon-group", "icon-coupon", "icon-member"][index] ?? "icon-grid",
        name: item.name
      }));
    }
    if (products.items.length) {
      flashItems.value = products.items.slice(0, 4).map(toDisplayProduct);
    }
    if (recommended.length) {
      recommendItems.value = recommended.slice(0, 4).map(toDisplayProduct);
    }
  } catch {
    // API 未启动时保留已冻结通过的高端尊享风静态兜底。
  }
});

function toDisplayProduct(item: ProductListItem, index = 0): DisplayProduct {
  const imageClass = item.name.includes("蟹") ? "photo-crab" : item.name.includes("鲍") ? "photo-abalone" : item.name.includes("生蚝") ? "photo-oyster" : item.name.includes("刺身") || item.name.includes("鱼") ? "photo-salmon" : "photo-lobster";
  const price = String(item.minSalePrice ?? "0.00");
  const oldPrice = String(item.marketPrice ?? item.minMarketPrice ?? item.minSalePrice ?? "0.00");
  return { id: String(item.id ?? index), imageClass, name: item.name, price, oldPrice };
}

function openDetail(id: string) {
  if (!id.startsWith("demo-")) {
    uni.navigateTo({ url: `/pages/product-detail/index?id=${id}` });
  }
}
</script>

<style scoped>
.page{min-height:100vh;box-sizing:border-box;padding:12px 0 16px;background:#f7f3ec;color:#181714;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}.visual-title{width:327px;margin:0 auto 8px;text-align:center}.scheme,.subtitle{display:block}.scheme{font-size:16px;font-weight:700;line-height:24px}.subtitle{color:#6d655a;font-size:13px;line-height:20px}.miniapp-shell{width:327px;height:650px;margin:0 auto;overflow:hidden;border-radius:7px;background:#10100e;box-shadow:0 2px 8px rgba(0,0,0,.16)}.status-row{display:flex;align-items:center;justify-content:space-between;height:26px;padding:0 12px;color:#f7f4ee;font-size:12px;font-weight:700}.signal{display:flex;align-items:flex-end;gap:3px}.signal text{display:block;width:3px;border-radius:2px;background:#f7f4ee}.signal text:nth-child(1){height:6px}.signal text:nth-child(2){height:9px}.signal text:nth-child(3){height:12px}.signal view{width:18px;height:9px;margin-left:4px;border:1px solid #f7f4ee;border-radius:2px}.native-top{display:flex;align-items:center;justify-content:space-between;height:31px;padding:0 12px;color:#f7f4ee;font-size:12px;font-weight:600}.location{display:flex;align-items:center;gap:6px}.pin-icon{position:relative;width:7px;height:7px;border:2px solid #f7f4ee;border-radius:50%}.pin-icon:after{position:absolute;left:1px;bottom:-5px;width:5px;height:5px;background:#f7f4ee;transform:rotate(45deg);content:""}.capsule{display:flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:14px;background:rgba(255,255,255,.08)}.capsule text{width:4px;height:4px;border-radius:50%;background:#f7f4ee}.ring{width:13px;height:13px;border:2px solid #f7f4ee;border-radius:50%}.search{display:flex;align-items:center;gap:6px;height:31px;margin:0 11px 10px;padding:0 12px;border-radius:17px;background:#f8f6f5;color:#999;font-size:11px}.search-icon{position:relative;width:11px;height:11px;border:1.5px solid #918b82;border-radius:50%}.search-icon:after{position:absolute;right:-5px;bottom:-3px;width:6px;height:1.5px;background:#918b82;transform:rotate(45deg);content:""}.banner{position:relative;height:138px;overflow:hidden;background:linear-gradient(90deg,rgba(16,16,14,.98) 0%,rgba(16,16,14,.9) 46%,rgba(41,24,13,.3) 100%),repeating-linear-gradient(170deg,rgba(255,255,255,.035) 0 1px,transparent 1px 8px)}.banner-copy{position:relative;z-index:3;width:178px;padding:29px 0 0 18px}.banner-title{display:block;color:#e9cf8a;font-size:20px;font-weight:700;line-height:25px}.banner-sub{display:block;margin-top:6px;color:#f7f4ee;font-size:11px;line-height:16px}.banner-btn{width:74px;height:27px;margin:13px 0 0;border-radius:14px;background:#d7aa4d;color:#181714;font-size:11px;font-weight:600;line-height:27px}.seafood{position:absolute;z-index:2}.lobster{right:15px;bottom:18px;width:145px;height:78px;border-radius:50% 45% 48% 50%;background:radial-gradient(circle at 32% 45%,#ffcf7a 0 3px,transparent 4px),radial-gradient(circle at 55% 50%,#ffd28c 0 3px,transparent 4px),radial-gradient(ellipse at 58% 44%,#e86a2f 0 18px,transparent 19px),radial-gradient(ellipse at 32% 48%,#9f2e17 0 18px,transparent 19px),linear-gradient(135deg,#b73618,#e97934 58%,#ffb264);box-shadow:0 7px 12px rgba(0,0,0,.24);transform:rotate(-18deg)}.lobster:before,.lobster:after{position:absolute;top:-30px;width:58px;height:42px;border:8px solid #d65222;border-bottom:0;border-radius:50px 50px 0 0;content:""}.lobster:before{left:-38px;transform:rotate(-28deg)}.lobster:after{right:-28px;transform:rotate(26deg)}.abalone{right:120px;bottom:16px;width:58px;height:43px;border-radius:50%;background:radial-gradient(circle at 50% 50%,#5a3216 0 13px,transparent 14px),radial-gradient(circle at 50% 50%,#e3c888 0 25px,#8b5a28 26px)}.quick-panel{display:grid;grid-template-columns:repeat(5,1fr);height:78px;padding:12px 4px 8px;box-sizing:border-box;border-radius:13px 13px 0 0;background:#fffdf8}.quick-item{text-align:center;color:#181714;font-size:11px;font-weight:500}.quick-icon{position:relative;width:31px;height:31px;margin:0 auto 6px;border-radius:50%;background:#22211d}.quick-icon:before,.quick-icon:after{position:absolute;content:""}.icon-grid:before{inset:9px;background:linear-gradient(#d7aa4d 0 0) 0 0/6px 6px,linear-gradient(#d7aa4d 0 0) 9px 0/6px 6px,linear-gradient(#d7aa4d 0 0) 0 9px/6px 6px,linear-gradient(#d7aa4d 0 0) 9px 9px/6px 6px;background-repeat:no-repeat}.icon-flash:before{left:12px;top:7px;width:10px;height:18px;background:#d7aa4d;clip-path:polygon(45% 0,100% 0,65% 44%,100% 44%,27% 100%,43% 56%,0 56%)}.icon-group:before{left:8px;top:8px;width:7px;height:7px;border-radius:50%;background:#d7aa4d;box-shadow:8px -2px 0 #d7aa4d,16px 0 0 #d7aa4d}.icon-group:after{left:7px;bottom:8px;width:19px;height:7px;border-radius:8px 8px 2px 2px;background:#d7aa4d}.icon-coupon:before{left:8px;top:10px;width:16px;height:11px;border:2px solid #d7aa4d;border-radius:3px}.icon-member:before{left:8px;top:9px;width:16px;height:12px;background:#d7aa4d;clip-path:polygon(0 30%,25% 46%,50% 0,75% 46%,100% 30%,88% 100%,12% 100%)}.dark-card{margin:8px 5px 0;padding:10px 10px 12px;box-sizing:border-box;border-radius:7px;background:#191610}.section-head,.section-left{display:flex;align-items:center}.section-head{justify-content:space-between;margin-bottom:8px}.section-left{gap:7px}.section-title{color:#e9cf8a;font-size:15px;font-weight:700}.countdown{display:flex;gap:3px}.countdown text{width:18px;height:18px;border-radius:3px;background:#f7f4ee;color:#181714;font-family:"DIN Alternate",Arial,sans-serif;font-size:11px;font-weight:700;line-height:18px;text-align:center}.more{color:#e9cf8a;font-size:11px}.flash-scroll{width:100%;white-space:nowrap}.flash-scroll ::-webkit-scrollbar{display:none;width:0;height:0}.flash-item{display:inline-block;width:72px;margin-right:7px;vertical-align:top}.product-img{position:relative;height:76px;overflow:hidden;border-radius:6px;background:#0e0e0d}.vip{position:absolute;left:3px;top:3px;padding:1px 3px;border-radius:2px;background:rgba(248,243,233,.92);color:#b88932;font-size:8px;font-weight:700}.product-name{display:block;margin-top:5px;overflow:hidden;color:#f7f4ee;font-size:11px;font-weight:600;line-height:14px;text-overflow:ellipsis;white-space:nowrap}.price-line{display:inline-flex;align-items:baseline;margin-top:2px;color:#e9cf8a;font-family:"DIN Alternate",Arial,sans-serif}.currency{font-size:11px;font-weight:600}.price{font-size:15px;font-weight:700}.old{display:block;margin-top:-1px;color:#918b82;font-size:9px;text-decoration:line-through}.recommend{height:128px}.recommend-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.recommend-img{height:59px;overflow:hidden;border-radius:6px;background:#0e0e0d}.photo-oyster{background:radial-gradient(ellipse at 38% 56%,#c8b17f 0 14px,transparent 15px),radial-gradient(ellipse at 64% 46%,#eeeeea 0 12px,transparent 13px),linear-gradient(135deg,#48525a,#1f2324 60%,#0d0d0c)}.photo-lobster{background:radial-gradient(ellipse at 58% 52%,#e66c2b 0 18px,transparent 19px),radial-gradient(ellipse at 34% 46%,#9f2d17 0 15px,transparent 16px),radial-gradient(ellipse at 78% 29%,#ff9b4b 0 12px,transparent 13px),linear-gradient(135deg,#3a2014,#0e0e0d)}.photo-crab{background:radial-gradient(ellipse at 50% 50%,#b54522 0 18px,transparent 19px),radial-gradient(ellipse at 22% 48%,#df7439 0 10px,transparent 11px),radial-gradient(ellipse at 78% 48%,#df7439 0 10px,transparent 11px),linear-gradient(135deg,#402519,#0e0e0d)}.photo-abalone{background:radial-gradient(ellipse at 50% 52%,#e1c178 0 17px,transparent 18px),radial-gradient(ellipse at 50% 52%,#5e381b 0 29px,transparent 30px),repeating-radial-gradient(circle at 52% 54%,rgba(255,255,255,.22) 0 1px,transparent 2px 5px),linear-gradient(135deg,#2d251a,#0e0e0d)}.photo-salmon{background:repeating-linear-gradient(145deg,rgba(255,255,255,.65) 0 2px,transparent 3px 9px),linear-gradient(135deg,#f39462,#dc6848 52%,#ac3d2c)}.palette{display:flex;align-items:center;gap:16px;width:327px;margin:16px auto 0;color:#181714;font-size:14px;font-weight:600}.dot{width:29px;height:29px;border-radius:50%}.gold{background:#d7aa4d}.black{background:#10100e}.tan{background:#b88932}.gray{background:#918b82}.light{background:#ddd9d2}.keywords{display:block;width:327px;margin:12px auto 0;color:#6d655a;font-size:13px;text-align:center}
</style>
