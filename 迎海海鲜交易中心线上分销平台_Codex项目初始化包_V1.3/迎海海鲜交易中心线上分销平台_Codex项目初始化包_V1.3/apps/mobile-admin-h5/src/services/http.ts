import { mobileAdminEnv } from "@/config/env";

type MobileAdminRequestOptions = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: unknown;
};

export function mobileAdminRequestPlaceholder(options: MobileAdminRequestOptions) {
  return {
    baseUrl: mobileAdminEnv.apiBaseUrl,
    ...options,
    note: "MOBILE-ADMIN-001 API 请求封装占位，未接入工作台业务接口"
  };
}
