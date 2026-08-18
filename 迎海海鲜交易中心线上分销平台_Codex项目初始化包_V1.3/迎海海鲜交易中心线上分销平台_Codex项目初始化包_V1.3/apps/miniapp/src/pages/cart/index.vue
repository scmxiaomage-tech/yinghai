<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">YINGHAI CART</text>
      <text class="title">购物车</text>
      <text class="subtitle">已选 {{ selectedCount }} 件 · 冷链鲜配到家</text>
    </view>

    <view v-if="items.length === 0" class="empty">
      <text>购物车还是空的</text>
      <button @click="goHome">去挑选海鲜</button>
    </view>

    <view v-else class="cart-list">
      <view v-for="item in items" :key="item.id" class="cart-card" :class="{ invalid: !item.available }">
        <button class="check" :class="{ checked: item.selected }" @click="toggleItem(item)">
          {{ item.selected ? "✓" : "" }}
        </button>
        <image class="thumb" :src="item.mainImageUrl || fallbackImage" mode="aspectFill" />
        <view class="info">
          <view class="line">
            <text class="name">{{ item.productName }}</text>
            <text v-if="!item.available" class="invalid-tag">{{ invalidText(item.unavailableReason) }}</text>
          </view>
          <text class="sku">{{ item.skuName }} · 库存 {{ item.availableStock }}</text>
          <view class="bottom">
            <text class="price">¥{{ money(item.salePrice) }}</text>
            <view class="qty">
              <button @click="changeQty(item, -1)">-</button>
              <text>{{ item.quantity }}</text>
              <button @click="changeQty(item, 1)">+</button>
            </view>
          </view>
          <button class="remove" @click="removeCartItem(item)">删除</button>
        </view>
      </view>
    </view>

    <view v-if="items.length" class="settle-bar">
      <button class="select-all" @click="toggleAll">{{ allSelected ? "取消全选" : "全选" }}</button>
      <view>
        <text class="total-label">合计</text>
        <text class="total">¥{{ totalAmount }}</text>
      </view>
      <button class="clear" @click="clearInvalid">清理失效</button>
      <button class="settle" @click="goConfirm">去结算</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { clearUnavailableCartItems, deleteCartItem, getCart, selectCartItem, selectCartItems, updateCartItem, type CartItem } from "@/services/cart";

const fallbackImage = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80";

const items = ref<CartItem[]>([
  {
    id: "cart-king-crab",
    skuId: "sku-king-crab",
    productName: "鲜活深海帝王蟹",
    skuName: "3-6斤/只 原产海域暂养直发",
    mainImageUrl: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80",
    quantity: 1,
    selected: true,
    salePrice: 998,
    availableStock: 28,
    available: true
  },
  {
    id: "cart-lobster",
    skuId: "sku-lobster",
    productName: "波士顿龙虾",
    skuName: "450-550g/只 活鲜冷链到家",
    mainImageUrl: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=800&q=80",
    quantity: 2,
    selected: true,
    salePrice: 128,
    availableStock: 46,
    available: true
  },
  {
    id: "cart-ab",
    skuId: "sku-ab",
    productName: "南澳活鲍鱼",
    skuName: "8头/斤 当日鲜活发货",
    mainImageUrl: "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=800&q=80",
    quantity: 1,
    selected: false,
    salePrice: 168,
    availableStock: 0,
    available: false,
    unavailableReason: "OUT_OF_STOCK"
  }
]);

const selectedItems = computed(() => items.value.filter((item) => item.selected && item.available));
const selectedCount = computed(() => selectedItems.value.reduce((sum, item) => sum + item.quantity, 0));
const allSelected = computed(() => items.value.length > 0 && items.value.every((item) => item.selected || !item.available));
const totalAmount = computed(() => selectedItems.value.reduce((sum, item) => sum + Number(item.salePrice) * item.quantity, 0).toFixed(2));

function money(value: string | number) {
  return Number(value).toFixed(2);
}

onMounted(loadCart);

async function loadCart() {
  try {
    const result = await getCart();
    items.value = result.cartItems;
  } catch {
    // API 未启动时保持高端尊享风兜底预览。
  }
}

function invalidText(reason?: string | null) {
  const map: Record<string, string> = {
    PRODUCT_OFF_SHELF: "已下架",
    SKU_DISABLED: "规格失效",
    OUT_OF_STOCK: "无库存",
    INSUFFICIENT_STOCK: "库存不足",
    deleted: "已删除"
  };
  return map[reason ?? ""] ?? "失效";
}

async function toggleItem(item: CartItem) {
  if (!item.available) return;
  item.selected = !item.selected;
  try {
    await selectCartItem(item.id, item.selected);
  } catch {
    // Mock preview can continue when API is not connected.
  }
}

async function toggleAll() {
  const next = !allSelected.value;
  items.value.forEach((item) => {
    if (item.available) item.selected = next;
  });
  try {
    await selectCartItems(next);
  } catch {
    // Mock preview fallback.
  }
}

async function changeQty(item: CartItem, step: number) {
  if (!item.available) return;
  item.quantity = Math.max(1, Math.min(item.availableStock, item.quantity + step));
  try {
    await updateCartItem(item.id, item.quantity);
  } catch {
    // Mock preview fallback.
  }
}

async function clearInvalid() {
  items.value = items.value.filter((item) => item.available || item.unavailableReason === "INSUFFICIENT_STOCK");
  try {
    await clearUnavailableCartItems();
  } catch {
    // Mock preview fallback.
  }
}

async function removeCartItem(item: CartItem) {
  items.value = items.value.filter((current) => current.id !== item.id);
  try {
    await deleteCartItem(item.id);
  } catch {
    // Mock preview fallback.
  }
}

function goConfirm() {
  const first = selectedItems.value[0];
  if (!first) {
    uni.showToast({ title: "请选择可购买商品", icon: "none" });
    return;
  }
  uni.navigateTo({ url: `/pages/order-confirm/index?skuId=${first.skuId}&quantity=${first.quantity}` });
}

function goHome() {
  uni.switchTab({ url: "/pages/home/index" });
}
</script>

<style scoped>
.page { min-height: 100vh; padding: 24rpx 24rpx 170rpx; background: #f7f2ea; color: #17120b; }
.hero { padding: 28rpx; border-radius: 34rpx; background: linear-gradient(135deg, #100f0d, #2b2117); color: #fffaf3; box-shadow: 0 20rpx 45rpx rgba(26,18,9,.18); }
.eyebrow { display:block; color:#d6a84b; font-size:22rpx; letter-spacing:8rpx; font-weight:900; }
.title { display:block; margin-top:12rpx; font-size:54rpx; font-weight:900; }
.subtitle { display:block; margin-top:8rpx; color:#cfc3aa; font-size:24rpx; }
.empty { display:grid; gap:24rpx; place-items:center; margin-top:28rpx; padding:90rpx 24rpx; border-radius:30rpx; background:#fffdf8; }
.empty button,.settle { border:0; border-radius:999rpx; background:linear-gradient(135deg,#f2d182,#c5902f); color:#17120b; font-weight:900; }
.cart-list { display:grid; gap:18rpx; margin-top:22rpx; }
.cart-card { display:flex; gap:18rpx; align-items:center; padding:18rpx; border-radius:30rpx; background:#fffdf8; box-shadow:0 12rpx 30rpx rgba(31,24,15,.08); }
.cart-card.invalid { opacity:.72; }
.check { width:46rpx; height:46rpx; line-height:42rpx; padding:0; border:2rpx solid #d6a84b; border-radius:50%; background:#fff; color:#17120b; font-weight:900; }
.check.checked { background:#d6a84b; }
.thumb { width:178rpx; height:144rpx; border-radius:22rpx; background:#eee; }
.info { flex:1; min-width:0; }
.line { display:flex; gap:12rpx; align-items:center; }
.name { flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:30rpx; font-weight:900; }
.invalid-tag { padding:4rpx 10rpx; border-radius:999rpx; background:#ef4444; color:#fff; font-size:20rpx; }
.sku { display:block; margin-top:8rpx; color:#7d735f; font-size:22rpx; }
.bottom { display:flex; justify-content:space-between; align-items:center; margin-top:18rpx; }
.price,.total { color:#d88900; font-size:34rpx; font-weight:900; }
.qty { display:flex; align-items:center; gap:12rpx; }
.qty button { width:48rpx; height:48rpx; line-height:44rpx; padding:0; border-radius:50%; background:#17120b; color:#f4d27a; font-weight:900; }
.remove { width:92rpx; height:44rpx; line-height:40rpx; padding:0; margin:10rpx 0 0 auto; border-radius:999rpx; background:#fff4e0; color:#9b6614; font-size:22rpx; font-weight:800; }
.settle-bar { position:fixed; left:0; right:0; bottom:0; display:flex; gap:16rpx; align-items:center; padding:18rpx 24rpx 34rpx; background:rgba(255,253,248,.96); box-shadow:0 -12rpx 30rpx rgba(0,0,0,.08); }
.select-all,.clear { width:132rpx; height:68rpx; line-height:68rpx; border-radius:999rpx; background:#1c1914; color:#f4d27a; font-size:24rpx; }
.clear { background:#fff7e5; color:#a86d00; }
.settle { flex:1; height:76rpx; line-height:76rpx; font-size:30rpx; }
.total-label { display:block; color:#766d5e; font-size:20rpx; }
</style>
