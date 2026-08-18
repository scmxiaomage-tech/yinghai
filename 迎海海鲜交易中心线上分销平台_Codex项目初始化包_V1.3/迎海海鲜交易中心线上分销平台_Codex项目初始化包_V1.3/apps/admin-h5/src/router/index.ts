import { createRouter, createWebHistory } from "vue-router";
import AdminLayout from "@/layouts/AdminLayout.vue";
import DashboardPlaceholder from "@/views/dashboard-placeholder/index.vue";
import ProductCenter from "@/views/product-center/index.vue";
import OrderCenter from "@/views/order-center/index.vue";
import { canAccessRoutePlaceholder } from "@/permissions/access";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: AdminLayout,
      children: [
        {
          path: "",
          name: "admin-dashboard-placeholder",
          component: DashboardPlaceholder,
          meta: { title: "后台首页骨架" }
        },
        {
          path: "products",
          name: "admin-product-center",
          component: ProductCenter,
          meta: { title: "商品中心" }
        },
        {
          path: "orders",
          name: "admin-order-center",
          component: OrderCenter,
          meta: { title: "订单管理" }
        }
      ]
    }
  ]
});

router.beforeEach((to) => canAccessRoutePlaceholder(to));
