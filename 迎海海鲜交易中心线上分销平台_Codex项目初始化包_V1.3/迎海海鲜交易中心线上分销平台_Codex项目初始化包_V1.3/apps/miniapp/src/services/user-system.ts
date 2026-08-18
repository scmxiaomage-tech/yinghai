import { request } from "./http";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends TokenPair {
  user: {
    id: string;
    openid: string;
    unionid?: string;
    phone?: string;
    status: string;
  };
}

export interface UserProfile {
  user_id: string;
  openid: string;
  unionid?: string;
  phone?: string;
  status: string;
  nickname?: string;
  avatar_url?: string;
  gender?: "unknown" | "male" | "female";
  birthday?: string;
  bio?: string;
}

export interface AddressPayload {
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  longitude?: number;
  latitude?: number;
  isDefault?: boolean;
}

export interface LocationPayload {
  longitude: number;
  latitude: number;
  city?: string;
}

export interface AppMessage {
  id: string;
  title: string;
  content: string;
  message_type: string;
  read_status: "unread" | "read";
  read_at?: string;
  created_at: string;
}

export const userSystemApi = {
  wechatLogin: (code: string, device?: string) =>
    request<LoginResult>({
      url: "/auth/wechat-login",
      method: "POST",
      data: { code, device }
    }),
  refreshToken: (refreshToken: string) =>
    request<TokenPair>({
      url: "/auth/refresh-token",
      method: "POST",
      data: { refreshToken }
    }),
  getMe: (token: string) => request<UserProfile>({ url: "/auth/me", token }),
  getProfile: (token: string) => request<UserProfile>({ url: "/user/profile", token }),
  updateProfile: (token: string, data: Partial<UserProfile>) =>
    request<UserProfile>({ url: "/user/profile", method: "PUT", data, token }),
  listAddresses: (token: string) => request<unknown[]>({ url: "/user/addresses", token }),
  createAddress: (token: string, data: AddressPayload) =>
    request<unknown>({ url: "/user/addresses", method: "POST", data, token }),
  updateAddress: (token: string, id: string, data: AddressPayload) =>
    request<unknown>({ url: `/user/addresses/${id}`, method: "PUT", data, token }),
  deleteAddress: (token: string, id: string) =>
    request<{ id: string; deleted: boolean }>({ url: `/user/addresses/${id}`, method: "DELETE", token }),
  setDefaultAddress: (token: string, id: string) =>
    request<unknown>({ url: `/user/addresses/${id}/default`, method: "PUT", token }),
  saveLocation: (token: string, data: LocationPayload) =>
    request<LocationPayload & { updatedAt: string }>({
      url: "/user/location",
      method: "POST",
      data,
      token
    }),
  getLocation: (token: string) =>
    request<(LocationPayload & { updatedAt: string }) | null>({ url: "/user/location", token }),
  listMessages: (token: string) => request<AppMessage[]>({ url: "/messages", token }),
  getUnreadCount: (token: string) => request<{ count: number }>({ url: "/messages/unread-count", token }),
  getMessage: (token: string, id: string) => request<AppMessage>({ url: `/messages/${id}`, token }),
  markMessageRead: (token: string, id: string) =>
    request<Pick<AppMessage, "id" | "read_status" | "read_at">>({
      url: `/messages/${id}/read`,
      method: "PUT",
      token
    }),
  markAllMessagesRead: (token: string) =>
    request<{ updated: number }>({ url: "/messages/read-all", method: "PUT", token })
};
