<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">海</span>
        <div>
          <strong>迎海管理后台</strong>
          <small>PC / iPad H5</small>
        </div>
      </div>
      <nav class="menu">
        <RouterLink
          v-for="item in menus"
          :key="item.path"
          :to="item.path"
          :class="{ active: route.path === item.path }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <section class="main">
      <header class="header">
        <div>
          <h1>迎海海鲜交易中心</h1>
          <p>统一后台骨架 · 商品与订单只读链路</p>
        </div>
        <div class="header-actions">
          <button type="button">消息 12</button>
          <button type="button">操作日志</button>
          <div class="avatar">管</div>
        </div>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();

const menus = [
  { label: "后台首页", path: "/" },
  { label: "商品管理", path: "/products" },
  { label: "订单管理", path: "/orders" },
  { label: "用户管理", path: "/" },
  { label: "库存管理", path: "/" },
  { label: "优惠券 / 秒杀", path: "/" },
  { label: "VIP / 积分", path: "/" },
  { label: "分销 / 佣金", path: "/" },
  { label: "供应商 / 采购", path: "/" },
  { label: "消息 / 待办", path: "/" },
  { label: "RBAC 权限", path: "/" }
];
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--yh-bg);
}

.sidebar {
  width: 256px;
  padding: 20px 14px;
  color: #fff;
  background: linear-gradient(180deg, #005b96 0%, #023047 100%);
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 8px 22px;
}

.brand-mark,
.avatar {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #1890ff, #005b96);
  box-shadow: 0 14px 30px rgba(0, 91, 150, 0.28);
  font-size: 24px;
  font-weight: 900;
}

.brand strong {
  display: block;
  font-size: 18px;
}

.brand small {
  color: #bfdbfe;
}

.menu {
  display: grid;
  gap: 6px;
}

.menu a {
  width: 100%;
  padding: 11px 12px;
  color: #dbeafe;
  text-align: left;
  text-decoration: none;
  border-radius: 12px;
}

.menu a.active,
.menu a:hover {
  color: #fff;
  background: #1890ff;
}

.main {
  flex: 1;
  min-width: 0;
}

.header {
  display: flex;
  height: 76px;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: #fff;
  border-bottom: 1px solid var(--yh-border);
}

.header h1 {
  margin: 0;
  font-size: 22px;
}

.header p {
  margin: 4px 0 0;
  color: var(--yh-muted);
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-actions button {
  padding: 10px 14px;
  color: var(--yh-deep);
  border: 1px solid var(--yh-border);
  border-radius: 999px;
  background: #eff6ff;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: #fff;
  font-size: 18px;
}

.content {
  padding: 20px;
}

@media (max-width: 1180px) {
  .sidebar {
    width: 96px;
  }

  .brand div {
    display: none;
  }

  .menu a {
    font-size: 13px;
    text-align: center;
  }
}
</style>
