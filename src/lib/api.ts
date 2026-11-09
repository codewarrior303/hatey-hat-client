import { authClient } from "./auth-client";
import { getCachedData, setCachedData, invalidateCache } from "./cache";

export { getCachedData, setCachedData, invalidateCache };

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && !host.includes("127.0.0.1")) {
      return "https://hatey-hat-api.vercel.app";
    }
    return "http://localhost:5000";
  }

  if (process.env.NODE_ENV === "production") {
    return "https://hatey-hat-api.vercel.app";
  }

  if (
    process.env.NEXT_PUBLIC_API_URL &&
    !process.env.NEXT_PUBLIC_API_URL.includes("localhost") &&
    !process.env.NEXT_PUBLIC_API_URL.includes("127.0.0.1")
  ) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  return "http://localhost:5000";
}

export const API_BASE = "https://hatey-hat-api.vercel.app";

export class ClientApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors?: { field: string; message: string }[]
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

let cachedAuthToken: string | null = null;
let tokenExpiresAt = 0;

export function invalidateAuthTokenCache() {
  cachedAuthToken = null;
  tokenExpiresAt = 0;
}

export async function getAuthToken(): Promise<string | null> {
  // Return cached token if valid (keeps a 30s buffer before expiry)
  if (cachedAuthToken && Date.now() < tokenExpiresAt - 30_000) {
    return cachedAuthToken;
  }

  // 1. Direct fetch to local Next.js route (works seamlessly in all browsers)
  try {
    const localRes = await fetch("/api/auth/token", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (localRes.ok) {
      const data = await localRes.json();
      if (data?.token && typeof data.token === "string") {
        cachedAuthToken = data.token;
        tokenExpiresAt = Date.now() + 5 * 60 * 1000; // cache for 5 minutes
        return data.token;
      }
    }
  } catch {
    // Silent: expected when unauthenticated or during initial session resolution
  }

  // 2. Fallback via Better-Auth client
  try {
    const res = await authClient.token();
    if (res?.data?.token) {
      cachedAuthToken = res.data.token;
      tokenExpiresAt = Date.now() + 5 * 60 * 1000;
      return res.data.token;
    }
  } catch {
    // Silent: expected when unauthenticated
  }

  // 3. Fallback: check session database token from active Better-Auth session
  try {
    const sessionRes = await authClient.getSession();
    const sessionToken = (sessionRes?.data as any)?.session?.token;
    if (sessionToken && typeof sessionToken === "string") {
      cachedAuthToken = sessionToken;
      tokenExpiresAt = Date.now() + 5 * 60 * 1000;
      return sessionToken;
    }
  } catch {
    // Ignore fallback failure
  }

  return null;
}

interface FetchOptions extends RequestInit {
  auth?: boolean;
  skipCache?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<{ success: boolean; data: T; message?: string; count?: number }> {
  const { auth = false, skipCache = false, headers = {}, ...rest } = options;

  const isGet = !rest.method || rest.method.toUpperCase() === "GET";
  // NEVER serve or store authenticated endpoints (e.g. /my, personal events) in generic cache
  const shouldCache = isGet && !skipCache && !auth;

  // 1. Instant cache return for GET requests (eliminates redundant database/network hits)
  if (shouldCache) {
    const cached = getCachedData<T>(path);
    if (cached !== null) {
      return {
        success: true,
        data: cached,
        count: Array.isArray(cached) ? cached.length : undefined,
      };
    }
  }

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    let token = await getAuthToken();
    if (!token) {
      // Small pause to resolve hydration race condition after fresh OAuth sign-in
      await new Promise((resolve) => setTimeout(resolve, 200));
      token = await getAuthToken();
    }
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    } else {
      throw new ClientApiError(
        401,
        "Authentication session could not be verified. Please sign in or refresh the page."
      );
    }
  }

  const apiBase = getApiBase();
  const url = `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...rest,
      headers: reqHeaders,
    });
  } catch {
    throw new ClientApiError(
      0,
      `Cannot connect to Hatey Hat API at ${apiBase}. Please ensure the server is running.`
    );
  }

  // Automatic retry on 401 with refreshed token (handles 15m JWT expiry)
  if (res.status === 401 && auth) {
    try {
      const freshToken = await getAuthToken();
      if (freshToken && freshToken !== reqHeaders.Authorization?.replace("Bearer ", "")) {
        reqHeaders.Authorization = `Bearer ${freshToken}`;
        res = await fetch(url, {
          ...rest,
          headers: reqHeaders,
        });
      }
    } catch {
      // Fall through to error handling below
    }
  }

  let body: any;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message = body?.message || `Request failed with status ${res.status}`;
    throw new ClientApiError(res.status, message, body?.errors);
  }

  // 2. Save fresh GET response to session cache
  if (shouldCache && body?.data !== undefined) {
    setCachedData(path, body.data);
  }

  // 3. Automatically invalidate cache when data is modified
  if (!isGet) {
    invalidateCache("/api/events");
    invalidateCache("/api/joins");
  }

  return body;
}

// Common event type constants
export const EVENT_TYPES = [
  "Flood & Disaster Relief",
  "Emergency Response",
  "Winter Relief",
  "Food Distribution",
  "Health Camp",
  "Blood Donation",
  "Cleanup",
  "Plantation",
  "Education",
  "Donation",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface EventItem {
  _id: string;
  slug?: string;
  title: string;
  description: string;
  eventType: EventType;
  thumbnail: string;
  location: string;
  eventDate: string;
  creatorEmail: string;
  creatorName: string;
  creatorPhone?: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
  participants?: number;
  hasJoined?: boolean;
  organizerRating?: number;
  organizerConcludedEvents?: number;
  organizerRatingReason?: string;
}

export interface JoinItem {
  _id: string;
  eventId: string;
  eventSlug?: string;
  eventTitle: string;
  eventDate: string;
  eventThumbnail: string;
  eventLocation: string;
  eventType: EventType;
  userEmail: string;
  userName: string;
  joinedAt: string;
}
