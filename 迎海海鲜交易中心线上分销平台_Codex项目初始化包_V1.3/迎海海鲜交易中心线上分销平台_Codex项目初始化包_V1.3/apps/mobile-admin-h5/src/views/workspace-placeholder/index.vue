<template>
  <section class="workspace">
    <div class="summary card">
      <div v-for="item in summary" :key="item.label">
        <strong>{{ item.value }}</strong>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div class="quick-grid">
      <button v-for="item in quickActions" :key="item.label" type="button">
        <b>{{ item.icon }}</b>
        <span>{{ item.label }}</span>
        <em>{{ item.count }}</em>
      </button>
    </div>

    <section class="card">
      <div class="section-head">
        <h2>待办事项</h2>
        <a>查看全部</a>
      </div>
      <article v-for="task in tasks" :key="task.title" class="task">
        <span :class="['dot', task.level]"></span>
        <div>
          <strong>{{ task.title }}</strong>
          <p>{{ task.desc }}</p>
        </div>
        <button type="button">处理</button>
      </article>
    </section>

    <section class="state-grid">
      <div class="card state">空状态<br /><small>暂无待办</small></div>
      <div class="card state">加载中<br /><small>正在同步</small></div>
      <div class="card state">错误态<br /><small>网络异常</small></div>
    </section>
  </section>
</template>

<script setup lang="ts">
const summary = [
  { label: "待发货", value: "32" },
  { label: "售后", value: "8" },
  { label: "采购", value: "15" }
];

const quickActions = [
  { icon: "车", label: "配送任务", count: "56" },
  { icon: "客", label: "客服售后", count: "8" },
  { icon: "采", label: "采购任务", count: "15" },
  { icon: "财", label: "财务待审", count: "6" }
];

const tasks = [
  { level: "urgent", title: "订单待发货 32 单", desc: "冷链时效订单优先处理" },
  { level: "warn", title: "库存预警 5 个商品", desc: "梭子蟹、帝王蟹库存不足" },
  { level: "info", title: "售后待处理 8 单", desc: "退款、补发、坏单包赔" }
];
</script>

<style scoped>
.workspace {
  display: grid;
  gap: 12px;
}

.card {
  padding: 16px;
  background: #fff;
  border: 1px solid var(--yh-border);
  border-radius: 22px;
  box-shadow: 0 16px 36px rgba(8, 47, 73, 0.08);
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.summary div {
  padding: 12px;
  border-radius: 16px;
  background: #f0f9ff;
}

.summary strong {
  display: block;
  color: var(--yh-deep);
  font-size: 26px;
}

.summary span,
.task p,
.state small {
  color: var(--yh-muted);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.quick-grid button {
  position: relative;
  min-height: 88px;
  padding: 14px;
  text-align: left;
  border: 0;
  border-radius: 22px;
  background: linear-gradient(135deg, #fff, #e0f2fe);
  box-shadow: 0 12px 28px rgba(8, 47, 73, 0.06);
}

.quick-grid b {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #fff;
  border-radius: 12px;
  background: var(--yh-primary);
}

.quick-grid span {
  display: block;
  margin-top: 8px;
  color: var(--yh-text);
  font-weight: 900;
}

.quick-grid em {
  position: absolute;
  top: 12px;
  right: 12px;
  color: var(--yh-warning);
  font-style: normal;
  font-weight: 900;
}

.section-head,
.task {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-head h2 {
  margin: 0;
  font-size: 20px;
}

.section-head a {
  color: var(--yh-primary);
}

.task {
  gap: 10px;
  padding: 14px 0;
  border-top: 1px solid #e2e8f0;
}

.task:first-of-type {
  margin-top: 8px;
}

.task strong {
  color: var(--yh-text);
}

.task p {
  margin: 4px 0 0;
}

.task button {
  padding: 8px 12px;
  color: #fff;
  border: 0;
  border-radius: 999px;
  background: var(--yh-primary);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.urgent {
  background: var(--yh-error);
}

.warn {
  background: var(--yh-gold);
}

.info {
  background: var(--yh-primary);
}

.state-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.state {
  min-height: 92px;
  text-align: center;
  color: var(--yh-deep);
  font-weight: 900;
}
</style>
