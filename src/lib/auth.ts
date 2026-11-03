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

// Strict trusted origins: in production, NO wildcards and NO localhost allowed
const trustedOrigins = isProd
  ? [appUrl.replace(/\/+$/, "")]
  : Array.from(new Set([appUrl.replace(/\/+$/, ""), "http://localhost:3000"]));

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: secret || "development-secret-minimum-32-characters-hatey-hat-platform",
  baseURL: appUrl,
  trustedOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // refresh rolling expiry once a day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days in client cookies
    },
  },
  advanced: {
    cookiePrefix: "hatey_hat",
    useSecureCookies: isProd,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    storage: "database", // Persist rate limiting in MongoDB across serverless instances
    customRules: {
      "/sign-in/email": { window: 60, max: 5 }, // 5 failed attempts per min triggers progressive block
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
      // Per-email throttling to prevent brute-force credential stuffing across multiple IPs
      if (ctx.path === "/sign-in/email") {
        const email = (ctx.body as any)?.email;
        if (email && typeof email === "string") {
          const normalizedEmail = email.toLowerCase().trim();
          const attemptsKey = `email_login:${normalizedEmail}`;
          const now = Date.now();
          const windowMs = 60 * 1000;
          const limit = 5;

          try {
            const rateLimitsCol = db.collection("rate_limits");
            const record = await rateLimitsCol.findOneAndUpdate(
              { key: attemptsKey },
              {
                $inc: { count: 1 },
                $setOnInsert: { expiresAt: new Date(now + windowMs) },
              },
              { upsert: true, returnDocument: "after" }
            );

            if (record && record.count > limit) {
              throw new Error("Too many sign-in attempts for this account. Please wait a minute and try again.");
            }
          } catch (err: any) {
            if (err?.message?.includes("Too many")) throw err;
            // Fail open on database connection errors to prevent locking out legitimate users
          }
        }
      }

      // Server-side password validation: >= 6 chars, uppercase, lowercase
      if (ctx.path === "/sign-up/email") {
        const password = (ctx.body as any)?.password;
        if (typeof password !== "string" || password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
          throw new Error("Password must be at least 6 characters long and include at least one uppercase and one lowercase letter");
        }
        const image = (ctx.body as any)?.image;
        if (image && typeof image === "string") {
          if (!/^https?:\/\//i.test(image) || /^(javascript|data|vbscript|file):/i.test(image)) {
            throw new Error("Avatar image URL must start with http:// or https://");
          }
        }
      }

      // Server-side profile image validation on updateUser
      if (ctx.path === "/user/update") {
        const image = (ctx.body as any)?.image;
        if (image && typeof image === "string") {
          if (!/^https?:\/\//i.test(image) || /^(javascript|data|vbscript|file):/i.test(image)) {
            throw new Error("Avatar image URL must start with http:// or https://");
          }
        }
      }
    }),
  },
  plugins: [
    jwt({
      jwt: {
        // Short token lifetime (15 minutes). Client keeps in memory only.
        expirationTime: "15m",
      },
    }),
  ],
});
