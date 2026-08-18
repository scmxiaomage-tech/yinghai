import { defineStore } from "pinia";
import {
  AddressPayload,
  AppMessage,
  LocationPayload,
  UserProfile,
  userSystemApi
} from "@/services/user-system";
import { USER_REFRESH_TOKEN_STORAGE_KEY, USER_TOKEN_STORAGE_KEY } from "./index";

export const useUserSystemStore = defineStore("userSystem", {
  state: () => ({
    accessToken: uni.getStorageSync(USER_TOKEN_STORAGE_KEY) as string,
    refreshToken: uni.getStorageSync(USER_REFRESH_TOKEN_STORAGE_KEY) as string,
    profile: null as UserProfile | null,
    addresses: [] as unknown[],
    location: null as (LocationPayload & { updatedAt: string }) | null,
    messages: [] as AppMessage[],
    unreadCount: 0
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.accessToken)
  },
  actions: {
    setTokens(accessToken: string, refreshToken: string) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      uni.setStorageSync(USER_TOKEN_STORAGE_KEY, accessToken);
      uni.setStorageSync(USER_REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    },
    clearTokens() {
      this.accessToken = "";
      this.refreshToken = "";
      uni.removeStorageSync(USER_TOKEN_STORAGE_KEY);
      uni.removeStorageSync(USER_REFRESH_TOKEN_STORAGE_KEY);
    },
    async loginWithWechatCode(code: string) {
      const result = await userSystemApi.wechatLogin(code, uni.getSystemInfoSync().platform);
      this.setTokens(result.accessToken, result.refreshToken);
      await this.loadProfile();
      return result;
    },
    async loadProfile() {
      this.profile = await userSystemApi.getProfile(this.accessToken);
      return this.profile;
    },
    async updateProfile(data: Partial<UserProfile>) {
      this.profile = await userSystemApi.updateProfile(this.accessToken, data);
      return this.profile;
    },
    async loadAddresses() {
      this.addresses = await userSystemApi.listAddresses(this.accessToken);
      return this.addresses;
    },
    async createAddress(data: AddressPayload) {
      const result = await userSystemApi.createAddress(this.accessToken, data);
      await this.loadAddresses();
      return result;
    },
    async saveLocation(data: LocationPayload) {
      this.location = await userSystemApi.saveLocation(this.accessToken, data);
      return this.location;
    },
    async loadLocation() {
      this.location = await userSystemApi.getLocation(this.accessToken);
      return this.location;
    },
    async loadMessages() {
      this.messages = await userSystemApi.listMessages(this.accessToken);
      const unread = await userSystemApi.getUnreadCount(this.accessToken);
      this.unreadCount = unread.count;
      return this.messages;
    },
    async markMessageRead(id: string) {
      await userSystemApi.markMessageRead(this.accessToken, id);
      await this.loadMessages();
    }
  }
});
