import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { UserRole, USER_ROLES } from "@eduno/shared";


// Re-use the same MONGO_URI used by Mongoose so we don't open a second pool.
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/eduno";
const client = new MongoClient(mongoUri);
const db = client.db();

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

  // ---------- Email / Password ----------
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // ---------- User Schema ----------
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: USER_ROLES.ALUMNO,

      },
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
});
