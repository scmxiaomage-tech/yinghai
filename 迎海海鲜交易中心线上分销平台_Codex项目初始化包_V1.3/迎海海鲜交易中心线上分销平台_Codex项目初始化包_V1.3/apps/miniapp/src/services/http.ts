import { miniappEnv } from "@/config/env";

export interface ApiResponse<T> {
  code: number | string;
  message: string;
  data: T;
}

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  url: string;
  method?: RequestMethod;
  data?: string | object | ArrayBuffer;
  token?: string;
  headers?: Record<string, string>;
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  Object.assign(headers, options.headers ?? {});

  const response = await uni.request({
    url: `${miniappEnv.apiBaseUrl}${options.url}`,
    method: (options.method ?? "GET") as UniApp.RequestOptions["method"],
    data: options.data,
    header: headers
  });

  const body = response.data as ApiResponse<T> | undefined;
  if (!body || (body.code !== 0 && body.code !== "OK")) {
    throw new Error(body?.message ?? "请求失败");
  }

  return body.data;
}
