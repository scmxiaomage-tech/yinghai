export const adminEnv = {
  appName: import.meta.env.VITE_ADMIN_APP_NAME ?? "迎海后台管理系统",
  apiBaseUrl: import.meta.env.VITE_ADMIN_API_BASE_URL ?? "/api/v2/admin"
} as const;
