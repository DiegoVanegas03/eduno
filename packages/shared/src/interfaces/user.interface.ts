import { UserRole } from "../constants/roles.constants";

export interface IUserBase {
  name: string;
  email: string;
  role: UserRole;
  career?: string;
  semester?: string;
  description?: string;
}

export interface IUser extends IUserBase {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBetterAuthUser extends IUserBase {
  id: string;
  createdAt: Date;
  emailVerified: boolean;
  image?: string | null | undefined;
}

export interface IUserResponse extends IBetterAuthUser {
  initialLetter?: string;
}
