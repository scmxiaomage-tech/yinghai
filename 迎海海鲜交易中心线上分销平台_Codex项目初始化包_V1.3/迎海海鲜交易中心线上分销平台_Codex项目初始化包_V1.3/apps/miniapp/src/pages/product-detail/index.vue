<template>
  <view class="page">
    <view class="shell">
      <view class="hero" :class="heroClass">
        <view class="topline">
          <text class="back" @click="goBack">‹</text>
          <text class="title">商品详情</text>
          <text class="more">•••</text>
        </view>
        <view class="hero-copy">
          <text class="eyebrow">YINGHAI PRIME</text>
          <text class="name">{{ detail?.name ?? fallback.name }}</text>
          <text class="subtitle">{{ detail?.subtitle ?? fallback.subtitle }}</text>
        </view>
      </view>

      <view class="info-card">
        <view class="price-row">
          <view>
            <text class="price">¥{{ selectedSku?.salePrice ?? fallback.skus[0].salePrice }}</text>
            <text class="market">¥{{ selectedSku?.marketPrice ?? fallback.skus[0].marketPrice }}</text>
          </view>
          <text class="stock" :class="{ soldout: stockStatus === 'OUT_OF_STOCK' }">{{ stockText }}</text>
        </view>
        <view class="meta-grid">
          <text>产地：{{ detail?.origin ?? fallback.origin }}</text>
          <text>储存：{{ detail?.storageMethod ?? fallback.storageMethod }}</text>
          <text>单位：{{ detail?.unit ?? fallback.unit }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-head"><text>规格选择</text><text>SKU</text></view>
        <view class="sku-list">
          <view
            v-for="sku in skus"
            :key="sku.id"
            class="sku"
            :class="{ active: sku.id === selectedSkuId, disabled: sku.status === 'disabled' || sku.stockStatus === 'OUT_OF_STOCK' }"
            @click="selectSku(sku.id)"
          >
            <text>{{ sku.name }}</text>
            <text>{{ skuStatusText(sku) }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-head"><text>商品详情</text><text>DETAIL</text></view>
        <view class="detail-long">
          <view class="detail-panel photo-lobster">
            <text>鲜活到港 · 全程冷链</text>
          </view>
          <view class="detail-panel photo-abalone">
            <text>规格分拣 · 坏单包赔</text>
          </view>
          <view class="detail-panel photo-salmon">
            <text>{{ detail?.description ?? fallback.description }}</text>
          </view>
        </view>
      </view>

      <view class="section recommend">
        <view class="section-head"><text>猜你喜欢</text><text>更多 ›</text></view>
        <view class="recommend-row">
          <view v-for="item in recommended" :key="item.id" class="recommend-item" @click="openDetail(item.id)">
            <view class="thumb photo-crab"></view>
            <text>{{ item.name }}</text>
          </view>
        </view>
      </view>

      <view class="buy-bar">
        <button class="cart-btn" @click="addCurrentSkuToCart">加入购物车</button>
        <button class="buy-btn" @click="nextStageNotice">去结算</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { addCartItem } from "@/services/cart";
import { getProductDetail, getRecommendedProducts, type ProductDetail, type ProductListItem, type ProductSku } from "@/services/product";

const fallback: ProductDetail = {
  id: "demo-lobster",
  name: "波士顿龙虾",
  subtitle: "鲜活直达 · 尊享臻选",
  shelfStatus: "on_sale",
  category: { id: "demo", name: "龙虾" },
  mainImageUrl: "",
  description: "严选鲜活海鲜，源头分拣，全程冷链配送到家。",
  origin: "加拿大",
  storageMethod: "冷链鲜活",
  unit: "只",
  images: [],
  skus: [
    {
      id: "sku-demo-1",
      skuNo: "DEMO-LOBSTER-550",
      name: "450-550g/只",
      spec: {},
      salePrice: "258.00",
      marketPrice: "298.00",
      memberPrice: null,
      status: "enabled",
      availableStock: 20,
      stockStatus: "IN_STOCK"
    },
    {
      id: "sku-demo-2",
      skuNo: "DEMO-LOBSTER-900",
      name: "800-1000g/只",
      spec: {},
      salePrice: "398.00",
      marketPrice: "468.00",
      memberPrice: null,
      status: "disabled",
      availableStock: 0,
      stockStatus: "OUT_OF_STOCK"
    }
  ]
};

const detail = ref<ProductDetail>();
const recommended = ref<ProductListItem[]>([]);
const selectedSkuId = ref(fallback.skus[0].id);

const skus = computed(() => detail.value?.skus?.length ? detail.value.skus : fallback.skus);
const selectedSku = computed<ProductSku | undefined>(() => skus.value.find((sku) => sku.id === selectedSkuId.value));
const stockStatus = computed(() => selectedSku.value?.stockStatus ?? (selectedSku.value?.status === "disabled" ? "OUT_OF_STOCK" : "IN_STOCK"));
const stockText = computed(() => stockStatus.value === "OUT_OF_STOCK" ? "售罄" : stockStatus.value === "LOW_STOCK" ? "低库存" : "现货可售");
const heroClass = computed(() => detail.value?.name?.includes("鲍") ? "photo-abalone" : detail.value?.name?.includes("刺身") ? "photo-salmon" : "photo-lobster");

onLoad(async (query) => {
  const id = typeof query?.id === "string" ? query.id : "";
  try {
    if (id) {
      detail.value = await getProductDetail(id);
      selectedSkuId.value = detail.value.skus[0]?.id ?? fallback.skus[0].id;
    }
    recommended.value = await getRecommendedProducts();
  } catch {
    recommended.value = [
      { id: "demo-lobster", name: "鲜活龙虾" },
      { id: "demo-crab", name: "膏蟹礼盒" },
      { id: "demo-abalone", name: "深海活鲍" },
      { id: "demo-salmon", name: "刺身拼盘" }
    ];
  }
});

function selectSku(id: string) {
  const sku = skus.value.find((item) => item.id === id);
  if (sku?.status !== "disabled" && sku?.stockStatus !== "OUT_OF_STOCK") selectedSkuId.value = id;
}

function skuStatusText(sku: ProductSku) {
  if (sku.status === "disabled" || sku.stockStatus === "OUT_OF_STOCK") return "售罄";
  if (sku.stockStatus === "LOW_STOCK") return `低库存 ${sku.availableStock ?? ""}`;
  return `现货 ${sku.availableStock ?? ""}`;
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages/product-detail/index?id=${id}` });
}

async function addCurrentSkuToCart() {
  const sku = selectedSku.value;
  if (!sku || sku.status === "disabled" || sku.stockStatus === "OUT_OF_STOCK") {
    uni.showToast({ title: "当前规格暂不可加入", icon: "none" });
    return;
  }
  try {
    await addCartItem(sku.id, 1);
    uni.showToast({ title: "已加入购物车", icon: "success" });
  } catch {
    uni.showToast({ title: "预览模式：已加入购物车", icon: "none" });
  }
}

function nextStageNotice() {
  const sku = selectedSku.value;
  if (!sku) return;
  uni.navigateTo({ url: `/pages/order-confirm/index?skuId=${sku.id}&quantity=1` });
}

function goBack() {
  uni.navigateBack();
}
</script>

<style scoped>
.page{min-height:100vh;background:#f7f3ec;color:#181714;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}.shell{width:375px;max-width:100%;margin:0 auto;padding-bottom:20px}.hero{height:260px;position:relative;overflow:hidden;background:#10100e;color:#f7f4ee}.topline{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;height:44px;padding:0 14px}.back{font-size:30px;line-height:30px}.title{font-size:14px;font-weight:700}.more{font-size:18px}.hero-copy{position:absolute;left:18px;bottom:22px;z-index:2}.eyebrow{display:block;color:#d7aa4d;font-size:10px;letter-spacing:2px;font-weight:700}.name{display:block;margin-top:7px;font-size:24px;font-weight:700;color:#f7f4ee}.subtitle{display:block;margin-top:5px;color:#e9cf8a;font-size:13px}.info-card,.section{margin:10px 12px 0;padding:12px;border-radius:12px;background:#fffdf8;box-shadow:0 2px 8px rgba(0,0,0,.06)}.price-row{display:flex;align-items:center;justify-content:space-between}.price{color:#b88932;font-size:22px;font-weight:800;font-family:"DIN Alternate",Arial,sans-serif}.market{margin-left:8px;color:#918b82;font-size:12px;text-decoration:line-through}.stock{padding:5px 9px;border-radius:99px;background:#191610;color:#e9cf8a;font-size:12px;font-weight:700}.stock.soldout{background:#8e8980;color:#fff}.meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px;color:#6d655a;font-size:11px}.section-head{display:flex;justify-content:space-between;align-items:center;color:#181714;font-size:15px;font-weight:700}.section-head text:last-child{color:#b88932;font-size:11px}.sku-list{display:flex;gap:8px;margin-top:10px;overflow-x:auto}.sku{min-width:104px;padding:9px;border-radius:8px;border:1px solid rgba(0,0,0,.08);background:#f7f3ec}.sku text{display:block;font-size:12px}.sku text:last-child{margin-top:4px;color:#918b82;font-size:10px}.sku.active{border-color:#d7aa4d;background:#191610;color:#e9cf8a}.sku.disabled{opacity:.48}.detail-long{margin-top:10px;border-radius:10px;overflow:hidden}.detail-panel{height:210px;position:relative}.detail-panel text{position:absolute;left:14px;bottom:14px;color:#f7f4ee;font-size:20px;font-weight:700;text-shadow:0 2px 8px rgba(0,0,0,.28)}.recommend-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.thumb{height:58px;border-radius:7px}.recommend-item text{display:block;margin-top:5px;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.photo-lobster{background:radial-gradient(ellipse at 58% 52%,#e66c2b 0 42px,transparent 44px),radial-gradient(ellipse at 34% 46%,#9f2d17 0 36px,transparent 38px),linear-gradient(135deg,#3a2014,#0e0e0d)}.photo-crab{background:radial-gradient(ellipse at 50% 50%,#b54522 0 38px,transparent 40px),radial-gradient(ellipse at 22% 48%,#df7439 0 18px,transparent 20px),radial-gradient(ellipse at 78% 48%,#df7439 0 18px,transparent 20px),linear-gradient(135deg,#402519,#0e0e0d)}.photo-abalone{background:radial-gradient(ellipse at 50% 52%,#e1c178 0 38px,transparent 40px),radial-gradient(ellipse at 50% 52%,#5e381b 0 58px,transparent 60px),repeating-radial-gradient(circle at 52% 54%,rgba(255,255,255,.22) 0 2px,transparent 3px 9px),linear-gradient(135deg,#2d251a,#0e0e0d)}.photo-salmon{background:repeating-linear-gradient(145deg,rgba(255,255,255,.65) 0 3px,transparent 4px 12px),linear-gradient(135deg,#f39462,#dc6848 52%,#ac3d2c)}
.shell{padding-bottom:92px}.buy-bar{position:fixed;left:50%;bottom:0;z-index:20;display:flex;gap:10px;width:375px;max-width:100%;transform:translateX(-50%);padding:10px 12px 20px;box-sizing:border-box;background:rgba(255,253,248,.96);box-shadow:0 -10px 24px rgba(0,0,0,.1)}.buy-bar button{height:48px;line-height:48px;border:0;border-radius:999px;font-size:15px;font-weight:900}.cart-btn{flex:1;background:#191610;color:#f2d182}.buy-btn{flex:1.2;background:linear-gradient(135deg,#f2d182,#c5902f);color:#181714}
</style>
