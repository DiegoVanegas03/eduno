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
