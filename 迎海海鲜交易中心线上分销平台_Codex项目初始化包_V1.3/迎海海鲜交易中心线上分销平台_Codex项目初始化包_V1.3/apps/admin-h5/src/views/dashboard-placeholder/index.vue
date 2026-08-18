<template>
  <section class="dashboard">
    <div class="hero">
      <div>
        <h2>全局经营看板</h2>
        <p>订单、库存、采购、配送、分销佣金统一聚合，当前为 UI-Sprint0.5 Mock 数据。</p>
      </div>
      <button type="button">导出日报</button>
    </div>

    <div class="metrics">
      <article v-for="item in metrics" :key="item.label">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <em>{{ item.trend }}</em>
      </article>
    </div>

    <div class="panel-grid">
      <section class="panel table-panel">
        <div class="panel-head">
          <h3>订单管理统一模板</h3>
          <div class="filters">
            <input placeholder="搜索订单号 / 客户 / 手机号" />
            <select><option>全部状态</option></select>
            <button type="button">查询</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>金额</th>
              <th>状态</th>
              <th>履约</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in orders" :key="row.no">
              <td>{{ row.no }}</td>
              <td>{{ row.name }}</td>
              <td class="money">{{ row.amount }}</td>
              <td><span class="tag">{{ row.status }}</span></td>
              <td>{{ row.delivery }}</td>
              <td><a>查看</a><a>备注</a></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="panel">
        <h3>页面状态样式</h3>
        <div class="states">
          <span>Loading</span>
          <span>Empty</span>
          <span>Error</span>
          <span>Disabled</span>
          <span>库存不足</span>
          <span>权限不足</span>
        </div>
      </section>

      <section class="panel">
        <h3>商品 / 库存表单</h3>
        <div class="form">
          <label>商品名称<input value="鲜活深海帝王蟹" /></label>
          <label>SKU<select><option>3-6斤/只</option></select></label>
          <label>库存预警<input value="20" /></label>
          <button type="button">保存</button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
const metrics = [
  { label: "今日订单", value: "1,286", trend: "+12.5%" },
  { label: "成交额", value: "¥98,760", trend: "+18.7%" },
  { label: "新增用户", value: "256", trend: "+8.3%" },
  { label: "待处理售后", value: "18", trend: "需跟进" }
];

const orders = [
  { no: "YH20260812001", name: "张三水产", amount: "¥568.00", status: "待配送", delivery: "冷链待发" },
  { no: "YH20260812002", name: "海鲜批发商行", amount: "¥1,268.00", status: "已支付", delivery: "采购中" },
  { no: "YH20260812003", name: "王五海鲜店", amount: "¥789.00", status: "已完成", delivery: "已签收" }
];
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 16px;
}

.hero,
.panel,
.metrics article {
  background: #fff;
  border: 1px solid var(--yh-border);
  border-radius: 20px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  color: #fff;
  background: linear-gradient(135deg, #005b96, #1890ff);
}

.hero h2,
.panel h3 {
  margin: 0 0 8px;
}

.hero p {
  margin: 0;
  color: #e0f2fe;
}

button {
  padding: 10px 16px;
  border: 0;
  border-radius: 12px;
  background: var(--yh-gold);
  color: #06233a;
  font-weight: 800;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.metrics article {
  padding: 18px;
}

.metrics span,
.metrics em {
  color: var(--yh-muted);
  font-style: normal;
}

.metrics strong {
  display: block;
  margin: 8px 0;
  color: var(--yh-deep);
  font-size: 28px;
}

.panel-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.panel {
  padding: 18px;
}

.table-panel {
  grid-row: span 2;
}

.panel-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.filters {
  display: flex;
  gap: 8px;
}

input,
select {
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--yh-border);
  border-radius: 10px;
}

table {
  width: 100%;
  margin-top: 14px;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 13px 10px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

th {
  color: var(--yh-muted);
  background: #f8fbff;
}

.money {
  color: var(--yh-warning);
  font-weight: 900;
}

.tag,
.states span {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 999px;
  color: var(--yh-deep);
  background: #e0f2fe;
}

a {
  margin-right: 10px;
  color: var(--yh-primary);
  cursor: pointer;
}

.states {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form {
  display: grid;
  gap: 12px;
}

.form label {
  display: grid;
  gap: 6px;
  color: var(--yh-muted);
}
</style>
