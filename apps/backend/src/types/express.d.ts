import { IBetterAuthUser } from "@eduno/shared";

declare global {
  namespace Express {
    interface Request {
      /**
       * Injected by `isAuthenticated` middleware.
       * Better Auth verifies the session cookie and attaches the user object.
       */
      user?: IBetterAuthUser;
    }
  }
}
