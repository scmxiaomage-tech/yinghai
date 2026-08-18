export const mobileAdminEnv = {
  appName: import.meta.env.VITE_MOBILE_ADMIN_APP_NAME ?? "迎海手机工作台",
  apiBaseUrl: import.meta.env.VITE_MOBILE_ADMIN_API_BASE_URL ?? "/api/v2/mobile-admin"
} as const;
