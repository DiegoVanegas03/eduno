import { UserRole } from "../constants/roles.constants";

export interface IUserBase {
  name: string;
  email: string;
  role: UserRole;
  career?: string;
  semester?: string;
  description?: string;
  isBanned?: boolean;
}

export interface IUser extends IUserBase {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IBetterAuthUser extends IUserBase {
  id: string;
  createdAt: Date | string;
  emailVerified: boolean;
  image?: string | null | undefined;
}

export interface IUserResponse extends IBetterAuthUser {
  initialLetter?: string;
}

export interface IAdminSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  isExpired: boolean;
}

export interface IAdminUserProfile {
  user: IUserResponse & {
    updatedAt: Date | string;
  };
  sessions: IAdminSession[];
}

export interface IUserDashboardStats {
  totalUsers: number;
  activeUsers: number;
  monthlyGrowth: number;
  profesoresCount: number;
  bannedUsers: number;
}

