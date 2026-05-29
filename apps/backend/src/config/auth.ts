import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { USER_ROLES, IUserBase } from "@eduno/shared";
import { customSession, admin } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";

import { getProfilePictureUrl } from "@/utils/minio-upload";
import { ac, roles } from "./permissions";

// Re-use the same MONGO_URI used by Mongoose so we don't open a second pool.
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/eduno";
const client = new MongoClient(mongoUri);
const db = client.db();

interface BetterAuthHookResponse {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    isBanned?: boolean;
    image?: string | null;
    [key: string]: unknown;
  };
  isBanned?: boolean;
  [key: string]: unknown;
}

export const auth = betterAuth({
  // ---------- Database ----------
  database: mongodbAdapter(db, {
    client,
  }),

  // ---------- Base URL ----------
  // All auth endpoints will be mounted at  /api/auth/**
  baseURL: process.env.BASE_URL || "http://localhost:3000",
  basePath: "/api/auth",

  // ---------- Secret ----------
  secret: process.env.BETTER_AUTH_SECRET || "cambiame-en-produccion",

  // ---------- Trusted origins ----------
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:4200"],

  // ---------- Advanced ----------
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
  },

  // ---------- Email / Password ----------
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: false,
  },

  // ---------- User Schema ----------
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      role: {
        type: "string",
        defaultValue: USER_ROLES.ALUMNO,
        input:false
      },
      career: {
        type: "string",
        defaultValue: "",
      },
      semester: {
        type: "string",
        defaultValue: "",
      },
      description: {
        type: "string",
        defaultValue: "",
      },
      isBanned: {
        type: "boolean",
        defaultValue: false,
        input:false
      },
    },
    changeEmail: {
      enabled: true,
    },
  },

  // ---------- Social providers ----------
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      // Azure AD tenant; "common" allows any Microsoft account
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
    },
  },

  // ---------- Plugins ----------
  plugins: [
    admin({
      ac,
      roles,
      adminRoles: [USER_ROLES.ADMIN, USER_ROLES.MODERADOR],
      defaultRole: USER_ROLES.ALUMNO,
      allowUserDeletion: true,
    }),
    customSession(async ({ session, user }) => {
      // Cast para que TypeScript reconozca los campos adicionales
      const extendedUser = user as typeof user & IUserBase;

      const finalImage = getProfilePictureUrl(extendedUser.image);

      return {
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          userId: session.userId,
        },
        user: {
          ...extendedUser,
          image: finalImage,
        },
      };
    }),
  ],

  // ---------- Hooks ----------
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const returned = ctx.context.returned as BetterAuthHookResponse | null;
      if (returned && typeof returned === "object") {
        // Bloquear acceso a usuarios baneados
        const userObj = returned.user || returned;
        if (userObj && typeof userObj === "object" && "isBanned" in userObj && userObj.isBanned === true) {
          return ctx.json(
            {
              success: false,
              message:
                "Tu cuenta ha sido suspendida/baneada. Comunícate con soporte.",
              error: "BANNED_USER",
            },
            { status: 403 },
          );
        }

        if (returned.user) {
          return ctx.json({
            ...returned,
            user: {
              ...returned.user,
              image: getProfilePictureUrl(returned.user.image),
            },
          });
        }
      }
    }),
  },
});
