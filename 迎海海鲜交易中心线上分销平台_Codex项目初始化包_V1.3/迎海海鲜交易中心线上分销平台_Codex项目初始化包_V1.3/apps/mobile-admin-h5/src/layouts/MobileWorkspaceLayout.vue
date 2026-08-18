<template>
  <div class="mobile-workspace">
    <header class="header">
      <div>
        <p>迎海移动工作台</p>
        <h1>今日待办与快捷处理</h1>
      </div>
      <button type="button">消息 8</button>
    </header>

    <main class="content">
      <RouterView />
    </main>

    <nav class="tabbar">
      <button v-for="item in tabs" :key="item" :class="{ active: item === '工作台' }" type="button">
        {{ item }}
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
const tabs = ["工作台", "待办", "消息", "我的"];
</script>

<style scoped>
.mobile-workspace {
  min-height: 100vh;
  padding-bottom: 80px;
  background: #eef7ff;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 18px 34px;
  color: #fff;
  background: linear-gradient(135deg, #005b96 0%, #1890ff 100%);
  border-bottom-right-radius: 28px;
  border-bottom-left-radius: 28px;
}

.header p {
  margin: 0 0 8px;
  color: #fde68a;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.header h1 {
  margin: 0;
  max-width: 240px;
  font-size: 28px;
  line-height: 1.16;
}

.header button {
  padding: 9px 12px;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.content {
  margin-top: -18px;
  padding: 0 14px 18px;
}

.tabbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--yh-border);
}

.tabbar button {
  min-height: 46px;
  color: var(--yh-muted);
  border: 0;
  border-radius: 15px;
  background: transparent;
  font-weight: 800;
}

.tabbar button.active {
  color: #fff;
  background: var(--yh-primary);
}
</style>
