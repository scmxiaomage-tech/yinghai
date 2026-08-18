export interface AuthUser {
  id: string;
  openid: string;
  status: string;
}

export interface JwtPayload {
  userId: string;
  openid: string;
  tokenType: "access" | "refresh";
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}
