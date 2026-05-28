import { IBetterAuthUser } from "./user.interface";

export interface ISession {
  id: string;
  expiresAt: Date;
  userId: string;
}

export interface IAuthResponse {
  user: IBetterAuthUser;
  session: ISession;
}

export interface IBetterAuthSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  ipAddress?: string;
  userAgent?: string;
}
