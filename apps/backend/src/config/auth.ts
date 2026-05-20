import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { UserRole, USER_ROLES, IUserBase } from "@eduno/shared";
import { customSession } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";

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
    customSession(async ({ session, user }) => {
      // Cast para que TypeScript reconozca los campos adicionales
      const extendedUser = user as typeof user & IUserBase;

      const { id, updatedAt, image, ...cleanedValues } = extendedUser;

      // Construir la URL de la imagen si es local (empieza con "eduno:")
      let finalImage = image;
      if (image && image.startsWith("eduno:")) {
        const fileName = image.split(":")[1];
        const minioHost = (
          process.env.MINIO_PUBLIC_URL || "http://localhost:9000"
        ).replace(/\/$/, "");
        finalImage = `${minioHost}/perfiles/${fileName}`;
      }

      return {
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          userId: session.userId,
        },
        user: {
          ...cleanedValues,
          image: finalImage,
        },
      };
    }),
  ],

  // ---------- Hooks ----------
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const returned = ctx.context.returned;
      if (returned && typeof returned === "object") {
        const transformUser = (user: any) => {
          if (user && typeof user.image === "string" && user.image.startsWith("eduno:")) {
            const fileName = user.image.split(":")[1];
            const minioHost = (
              process.env.MINIO_PUBLIC_URL || "http://localhost:9000"
            ).replace(/\/$/, "");
            user.image = `${minioHost}/perfiles/${fileName}`;
          }
        };

        let modified = false;

        if ("user" in returned && returned.user) {
          transformUser(returned.user);
          modified = true;
        }

        if ("image" in returned && typeof returned.image === "string" && returned.image.startsWith("eduno:")) {
          transformUser(returned);
          modified = true;
        }

        if (modified) {
          return ctx.json(returned);
        }
      }
    }),
  },
});
