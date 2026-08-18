import { createRouter, createWebHistory } from "vue-router";
import MobileWorkspaceLayout from "@/layouts/MobileWorkspaceLayout.vue";
import WorkspacePlaceholder from "@/views/workspace-placeholder/index.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: MobileWorkspaceLayout,
      children: [
        {
          path: "",
          name: "mobile-workspace-placeholder",
          component: WorkspacePlaceholder,
          meta: {
            title: "手机工作台骨架"
          }
        }
      ]
    }
  ]
});
