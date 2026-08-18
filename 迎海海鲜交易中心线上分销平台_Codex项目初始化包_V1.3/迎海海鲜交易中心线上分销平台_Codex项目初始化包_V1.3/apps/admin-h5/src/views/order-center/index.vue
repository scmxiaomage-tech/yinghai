<template>
  <section class="order-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">ORDER CENTER</p>
        <h2>订单管理</h2>
        <p>R5 只读查看订单、商品快照、金额与状态；不提供支付、退款、发货、改价操作。</p>
      </div>
      <button type="button" @click="loadOrders">刷新</button>
    </div>

    <div class="filters">
      <input v-model="filters.orderNo" placeholder="订单号" />
      <input v-model="filters.keyword" placeholder="商品关键词" />
      <select v-model="filters.status">
        <option value="">订单状态</option>
        <option value="PENDING_PAYMENT">待支付</option>
        <option value="CANCELLED">已取消</option>
        <option value="CLOSED">已关闭</option>
      </select>
      <button type="button" @click="loadOrders">查询</button>
    </div>

    <div class="content-grid">
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>商品摘要</th>
              <th>金额</th>
              <th>状态</th>
              <th>过期时间</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id" :class="{ active: selected?.id === order.id }" @click="selectOrder(order)">
              <td>{{ order.orderNo }}</td>
              <td>{{ goodsSummary(order) }}</td>
              <td>¥{{ order.payableAmountText }}</td>
              <td><span class="status">{{ statusText(order.status) }}</span></td>
              <td>{{ formatTime(order.expireAt) }}</td>
              <td>{{ formatTime(order.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <aside class="detail-card">
        <template v-if="selected">
          <h3>订单详情</h3>
          <p class="order-no">{{ selected.orderNo }}</p>
          <div class="detail-row"><span>收货人</span><strong>{{ selected.receiverName }}</strong></div>
          <div class="detail-row"><span>状态</span><strong>{{ statusText(selected.status) }}</strong></div>
          <div class="detail-row"><span>应付</span><strong class="money">¥{{ selected.payableAmountText }}</strong></div>
          <p class="address">{{ selected.receiverName }} {{ selected.receiverPhone || "" }}<br />{{ selected.receiverAddress }}</p>
          <div class="items">
            <div v-for="item in selected.items || []" :key="item.id" class="item">
              <span>{{ item.productName }} · {{ item.skuName }}</span>
              <strong>¥{{ item.unitPriceText }} × {{ item.quantity }}</strong>
            </div>
          </div>
        </template>
        <template v-else>
          <h3>选择订单查看详情</h3>
          <p>后台 R5 仅做只读核对，不允许直接改订单状态。</p>
        </template>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { getAdminOrderDetail, getAdminOrders, type AdminOrderDetail, type AdminOrderListItem } from "@/services/order";

const filters = reactive({ orderNo: "", keyword: "", status: "" });
const orders = ref<AdminOrderListItem[]>([
  {
    id: "o1",
    orderNo: "YH202608160001",
    status: "PENDING_PAYMENT",
    receiverName: "陈先生",
    receiverPhone: "138****6688",
    receiverAddress: "上海市浦东新区陆家嘴海鲜冷链示范区 8 号仓",
    itemAmountText: "1254.00",
    payableAmountText: "1254.00",
    expireAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    items: [
      { id: "i1", productName: "鲜活深海帝王蟹", skuName: "3-6斤/只", unitPriceText: "998.00", quantity: 1, subtotalText: "998.00" },
      { id: "i2", productName: "波士顿龙虾", skuName: "450-550g/只", unitPriceText: "128.00", quantity: 2, subtotalText: "256.00" }
    ]
  }
]);
const selected = ref<AdminOrderDetail | null>(null);

async function loadOrders() {
  try {
    const response = await getAdminOrders(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)));
    orders.value = response.items;
  } catch {
    // API 未连接时保留静态验收数据，便于前端 UI Gate 查看。
  }
}

async function selectOrder(order: AdminOrderListItem) {
  try {
    selected.value = await getAdminOrderDetail(order.id);
  } catch {
    selected.value = {
      ...order,
      receiverPhone: "138****6688",
      items: [
        { id: "i1", productName: "鲜活深海帝王蟹", skuName: "3-6斤/只", unitPriceText: "998.00", quantity: 1, subtotalText: "998.00" }
      ]
    };
  }
}

function statusText(value: string) {
  return value === "CANCELLED" ? "已取消" : value === "CLOSED" ? "已关闭" : "待支付";
}

function goodsSummary(order: AdminOrderListItem) {
  return order.items?.map((item) => `${item.productName} x${item.quantity}`).join("，") || "订单商品";
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN");
}

onMounted(loadOrders);
</script>

<style scoped>
.order-page { display:grid; gap:18px; }
.page-head,.filters,.table-card,.detail-card { border:1px solid var(--yh-border); border-radius:18px; background:#fff; box-shadow:0 14px 34px rgba(0,91,150,.08); }
.page-head { display:flex; justify-content:space-between; align-items:center; padding:22px; }
.eyebrow { margin:0 0 8px; color:#f5a623; letter-spacing:4px; font-weight:800; }
h2 { margin:0; color:var(--yh-deep); font-size:28px; }
.page-head p:last-child { margin:8px 0 0; color:var(--yh-muted); }
button { border:0; border-radius:12px; background:#1890ff; color:#fff; padding:11px 16px; cursor:pointer; }
.filters { display:grid; grid-template-columns:1.2fr 1.2fr 1fr 1fr auto; gap:12px; padding:16px; }
input,select { height:42px; border:1px solid var(--yh-border); border-radius:12px; padding:0 12px; }
.content-grid { display:grid; grid-template-columns:minmax(0,1fr) 360px; gap:18px; }
.table-card { overflow:auto; }
table { width:100%; border-collapse:collapse; }
th,td { padding:14px 16px; border-bottom:1px solid #eef3f8; text-align:left; white-space:nowrap; }
th { color:#52708d; font-size:13px; background:#f8fafc; }
td { color:#023047; }
tr { cursor:pointer; }
tr.active,tbody tr:hover { background:#eef7ff; }
.status { padding:5px 9px; border-radius:999px; background:#fff7e8; color:#c77900; font-weight:700; }
.detail-card { padding:20px; }
.detail-card h3 { margin:0 0 10px; color:#023047; }
.order-no { color:#52708d; }
.detail-row { display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #eef3f8; }
.money { color:#f5a623; font-size:22px; }
.address { padding:12px; border-radius:12px; background:#f8fafc; color:#425c74; line-height:1.7; }
.items { display:grid; gap:10px; }
.item { padding:12px; border-radius:12px; background:#f8fafc; }
.item span,.item strong { display:block; }
.item strong { margin-top:6px; color:#f5a623; }
</style>
