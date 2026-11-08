import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

const getAuthBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && !host.includes("127.0.0.1")) {
      return window.location.origin;
    }
    return "http://localhost:3000";
  }
  if (
    process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("localhost") &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("127.0.0.1")
  ) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  return "https://hatey-hat.vercel.app";
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  plugins: [jwtClient()],
});

export const { useSession, signIn, signOut, signUp, updateUser } = authClient;
