<template>
  <section class="product-center">
    <div class="page-head">
      <div>
        <p class="eyebrow">R2 PRODUCT CENTER</p>
        <h2>商品中心</h2>
        <p>分类、商品、SKU、图片与上下架管理入口；库存扣减留到 R3。</p>
      </div>
      <button type="button" @click="loadData">刷新数据</button>
    </div>

    <div class="stats">
      <article><strong>{{ displayCategories.length }}</strong><span>分类数</span></article>
      <article><strong>{{ displayProducts.length }}</strong><span>商品数</span></article>
      <article><strong>{{ onSaleCount }}</strong><span>已上架</span></article>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>分类管理</h3>
        <span>一级/二级分类；disabled 不向小程序展示。</span>
      </div>
      <div class="category-row">
        <span v-for="item in displayCategories" :key="item.id" :class="['category-pill', item.status]">
          {{ item.name }} / {{ item.code }}
        </span>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>商品管理</h3>
        <span>上架前校验分类、名称、主图、enabled SKU 与合法价格。</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>商品</th>
            <th>分类</th>
            <th>编码</th>
            <th>价格</th>
            <th>可售</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in displayProducts" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.categoryName }}</td>
            <td>{{ item.productNo }}</td>
            <td>¥{{ item.minSalePrice ?? "-" }}</td>
            <td>{{ item.hasStock ? "有SKU" : "无SKU" }}</td>
            <td><span class="status" :class="shelfStatus(item)">{{ statusText(shelfStatus(item)) }}</span></td>
            <td><button type="button" @click="toggleShelf(item)">{{ shelfStatus(item) === "on_sale" ? "下架" : "上架" }}</button></td>
          </tr>
        </tbody>
      </table>
      <div v-if="!displayProducts.length" class="empty">暂无商品数据</div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>库存管理</h3>
        <span>R3 SKU 库存、预警、流水与人工调整；保留 R2 SKU / 图片管理 API 入口。</span>
      </div>
      <table>
        <thead><tr><th>商品/SKU</th><th>总库存</th><th>锁定</th><th>可售</th><th>预警</th><th>状态</th><th>调整</th></tr></thead>
        <tbody>
          <tr v-for="item in displayInventories" :key="item.skuId">
            <td>{{ item.productName }} / {{ item.skuName }}</td>
            <td>{{ item.totalStock }}</td>
            <td>{{ item.lockedStock }}</td>
            <td>{{ item.availableStock }}</td>
            <td>{{ item.warningStock }}</td>
            <td><span class="status" :class="item.stockStatus">{{ stockStatusText(item.stockStatus) }}</span></td>
            <td><button type="button" @click="quickIncrease(item.skuId)">补货 +10</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>库存流水</h3>
        <span>库存变化必须有流水记录。</span>
      </div>
      <div class="ops-grid">
        <span v-for="tx in displayTransactions" :key="tx.id">
          {{ tx.type }} · SKU {{ tx.skuId }} · {{ tx.quantity }} · {{ tx.createdAt }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { adjustInventory, getAdminCategories, getAdminInventories, getAdminProducts, getInventoryTransactions, offSaleProduct, onSaleProduct, type AdminCategoryRow, type AdminProductRow, type InventoryRow, type InventoryTransactionRow } from "@/services/product";

const products = ref<AdminProductRow[]>([]);
const categories = ref<AdminCategoryRow[]>([]);
const inventories = ref<InventoryRow[]>([]);
const transactions = ref<InventoryTransactionRow[]>([]);

const fallbackProducts: AdminProductRow[] = [
  { id: "demo-1", name: "波士顿龙虾", productNo: "DEMO-LOBSTER", categoryName: "龙虾蟹类", shelf_status: "on_sale", minSalePrice: "258.00", hasStock: true },
  { id: "demo-2", name: "深海活鲍", productNo: "DEMO-ABALONE", categoryName: "贝类海鲜", shelf_status: "draft", minSalePrice: "128.00", hasStock: true },
  { id: "demo-3", name: "冰鲜三文鱼", productNo: "DEMO-SALMON", categoryName: "鱼类刺身", shelf_status: "off_sale", minSalePrice: "198.00", hasStock: true }
];

const fallbackCategories: AdminCategoryRow[] = [
  { id: "1001", name: "龙虾蟹类", code: "lobster-crab", status: "enabled", sortOrder: 10 },
  { id: "1002", name: "鱼类刺身", code: "fish-sashimi", status: "enabled", sortOrder: 20 },
  { id: "1003", name: "贝类海鲜", code: "shellfish", status: "enabled", sortOrder: 30 }
];

const displayProducts = computed(() => (products.value.length ? products.value : fallbackProducts));
const displayCategories = computed(() => (categories.value.length ? categories.value : fallbackCategories));
const displayInventories = computed(() => (inventories.value.length ? inventories.value : [
  { skuId: "demo-sku-1", skuNo: "DEMO", skuName: "450-550g/只", productId: "demo-1", productName: "波士顿龙虾", totalStock: 100, lockedStock: 12, availableStock: 88, soldStock: 36, warningStock: 10, stockStatus: "IN_STOCK" as const },
  { skuId: "demo-sku-2", skuNo: "DEMO", skuName: "10头/斤", productId: "demo-2", productName: "深海活鲍", totalStock: 8, lockedStock: 3, availableStock: 5, soldStock: 21, warningStock: 6, stockStatus: "LOW_STOCK" as const }
]));
const displayTransactions = computed(() => (transactions.value.length ? transactions.value : [
  { id: "demo-tx-1", skuId: "demo-sku-1", type: "INCREASE", quantity: 10, beforeStock: 90, afterStock: 100, beforeLockedStock: 12, afterLockedStock: 12, createdAt: "Runtime Pending" }
]));
const onSaleCount = computed(() => displayProducts.value.filter((item) => shelfStatus(item) === "on_sale").length);

onMounted(loadData);

async function loadData() {
  try {
    const [productResult, categoryResult, inventoryResult, transactionResult] = await Promise.all([getAdminProducts(), getAdminCategories(), getAdminInventories(), getInventoryTransactions()]);
    products.value = productResult.items;
    categories.value = categoryResult;
    inventories.value = inventoryResult.items;
    transactions.value = transactionResult.items;
  } catch {
    products.value = [];
    categories.value = [];
    inventories.value = [];
    transactions.value = [];
  }
}

async function quickIncrease(skuId: string) {
  if (skuId.startsWith("demo-")) return;
  await adjustInventory(skuId, { adjustmentType: "INCREASE", quantity: 10, remark: "后台快捷补货" });
  await loadData();
}

function stockStatusText(status: InventoryRow["stockStatus"]) {
  return status === "OUT_OF_STOCK" ? "缺货" : status === "LOW_STOCK" ? "低库存" : "有库存";
}

async function toggleShelf(item: AdminProductRow) {
  if (item.id.startsWith("demo-")) return;
  if (shelfStatus(item) === "on_sale") {
    await offSaleProduct(item.id);
  } else {
    await onSaleProduct(item.id);
  }
  await loadData();
}

function shelfStatus(item: AdminProductRow) {
  return item.shelfStatus ?? item.shelf_status;
}

function statusText(status: AdminProductRow["shelf_status"]) {
  return status === "on_sale" ? "已上架" : status === "off_sale" ? "已下架" : "草稿";
}
</script>

<style scoped>
.product-center{display:grid;gap:18px}.page-head,.panel{padding:20px;border-radius:18px;background:#fff;border:1px solid var(--yh-border);box-shadow:0 12px 28px rgba(8,47,73,.05)}.page-head{display:flex;justify-content:space-between;align-items:center}.eyebrow{margin:0 0 6px;color:var(--yh-gold);font-weight:900;letter-spacing:2px}.page-head h2{margin:0;font-size:28px}.page-head p{margin:6px 0 0;color:var(--yh-muted)}button{border:0;border-radius:999px;background:var(--yh-primary);color:#fff;padding:10px 16px;cursor:pointer}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.stats article{padding:18px;border-radius:16px;background:linear-gradient(135deg,#005b96,#1890ff);color:#fff}.stats strong{display:block;font-size:30px}.stats span{color:#dbeafe}.panel-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:14px}.panel-head h3{margin:0;font-size:20px}.panel-head span{color:var(--yh-muted)}table{width:100%;border-collapse:collapse}th,td{padding:12px 10px;text-align:left;border-bottom:1px solid var(--yh-border)}th{color:var(--yh-muted);font-size:13px}.status{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px}.status.on_sale{color:#047857;background:#d1fae5}.status.off_sale{color:#92400e;background:#fef3c7}.status.draft{color:#475569;background:#e2e8f0}.empty{padding:24px;text-align:center;color:var(--yh-muted)}.category-row,.ops-grid{display:flex;flex-wrap:wrap;gap:10px}.category-pill,.ops-grid span{padding:9px 12px;border-radius:999px;background:#f8fafc;border:1px solid var(--yh-border);color:#0f172a}.category-pill.disabled{opacity:.48}.ops-grid span{border-radius:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--yh-muted)}
</style>
