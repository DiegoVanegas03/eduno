import { IUser } from "@/models/user.model";

export interface IUserResponse {
  id: string;
  initialLetter: string;
  name: string;
  email: string;
  role: string;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  user?: IUserResponse;
  error?: string;
}

/**
 * Utility to map an IUser document to an IUserResponse interface.
 * This ensures consistency and type safety when sending user data to the frontend.
 */
export const mapUserToResponse = (user: IUser): IUserResponse => ({
  id: user._id.toString(),
  initialLetter: user.name.charAt(0).toUpperCase(),
  name: user.name,
  email: user.email,
  role: user.role,
});
