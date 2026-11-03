import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);
const db = client.db(process.env.MONGODB_DB || "hatey-hat");

const isProd = process.env.NODE_ENV === "production";
const secret = process.env.BETTER_AUTH_SECRET;
if (isProd && (!secret || secret.length < 32)) {
  throw new Error("BETTER_AUTH_SECRET must be set to a secure string with at least 32 characters in production");
}

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const trustedOrigins = Array.from(
  new Set([
    appUrl.replace(/\/+$/, ""),
    "http://localhost:3000",
  ])
);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: secret || "development-secret-minimum-32-characters-hatey-hat-platform",
  baseURL: appUrl,
  trustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Server-side password validation: >= 6 chars, uppercase, lowercase
      if (ctx.path === "/sign-up/email") {
        const password = (ctx.body as any)?.password;
        if (typeof password !== "string" || password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
          throw new Error("Password must be at least 6 characters long and include at least one uppercase and one lowercase letter");
        }
        const image = (ctx.body as any)?.image;
        if (image && typeof image === "string") {
          if (!/^https?:\/\//i.test(image) || /^(javascript|data|vbscript):/i.test(image)) {
            throw new Error("Avatar image URL must start with http:// or https://");
          }
        }
      }

      // Server-side profile image validation on updateUser
      if (ctx.path === "/user/update") {
        const image = (ctx.body as any)?.image;
        if (image && typeof image === "string") {
          if (!/^https?:\/\//i.test(image) || /^(javascript|data|vbscript):/i.test(image)) {
            throw new Error("Avatar image URL must start with http:// or https://");
          }
        }
      }
    }),
  },
  plugins: [
    jwt({
      jwt: {
        expirationTime: "1h",
      },
    }),
  ],
});
