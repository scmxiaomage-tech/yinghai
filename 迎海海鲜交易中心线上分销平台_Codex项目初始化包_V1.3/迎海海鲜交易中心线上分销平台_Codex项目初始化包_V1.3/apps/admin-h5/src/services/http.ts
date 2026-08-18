import { adminEnv } from "@/config/env";

type AdminRequestOptions = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: unknown;
};

export async function adminRequest<T>(options: AdminRequestOptions): Promise<T> {
  const response = await fetch(`${adminEnv.apiBaseUrl}${options.url}`, {
    method: options.method ?? "GET",
    headers: { "content-type": "application/json" },
    body: options.data ? JSON.stringify(options.data) : undefined
  });
  const body = (await response.json()) as { code: number | string; message: string; data: T };
  if (!response.ok || (body.code !== 0 && body.code !== "OK")) {
    throw new Error(body.message || "后台请求失败");
  }
  return body.data;
}
