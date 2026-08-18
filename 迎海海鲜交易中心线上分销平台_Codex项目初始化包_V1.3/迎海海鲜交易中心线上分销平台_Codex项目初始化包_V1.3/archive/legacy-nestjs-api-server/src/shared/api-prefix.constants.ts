export const API_NAMESPACE = {
  APP: "app",
  ADMIN: "admin",
  MOBILE_ADMIN: "mobile-admin"
} as const;

export const RESERVED_API_PREFIXES = [
  `/api/v1/${API_NAMESPACE.APP}`,
  `/api/v1/${API_NAMESPACE.ADMIN}`,
  `/api/v1/${API_NAMESPACE.MOBILE_ADMIN}`
] as const;
