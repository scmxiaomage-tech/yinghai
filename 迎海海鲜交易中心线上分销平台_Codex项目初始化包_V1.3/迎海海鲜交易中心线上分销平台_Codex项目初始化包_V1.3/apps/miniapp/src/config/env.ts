export const miniappEnv = {
  apiBaseUrl: import.meta.env.VITE_APP_API_BASE_URL ?? "/api/v2/app",
  appName: import.meta.env.VITE_APP_NAME ?? "迎海海鲜交易中心"
} as const;
