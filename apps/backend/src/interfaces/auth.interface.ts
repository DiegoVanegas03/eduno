import { IUser } from "@/models/user.model";
import { IUserResponse, IAuthResponse as ISharedAuthResponse } from "@eduno/shared";

// Local extension if needed, but for now we use the shared one
export interface IAuthResponse extends ISharedAuthResponse {
  success: boolean;
  message: string;
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
