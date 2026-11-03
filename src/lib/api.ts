import { authClient } from "./auth-client";
import { getCachedData, setCachedData, invalidateCache } from "./cache";

export { getCachedData, setCachedData, invalidateCache };

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

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

export async function getAuthToken(): Promise<string | null> {
  try {
    const res = await authClient.token();
    if (res?.data?.token) {
      return res.data.token;
    }
  } catch (err) {
    console.warn("Failed to retrieve token via authClient.token()", err);
  }

  // Fallback: direct cookie-authenticated fetch to the local Next.js route
  try {
    const localRes = await fetch("/api/auth/token", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (localRes.ok) {
      const data = await localRes.json();
      if (data?.token) return data.token;
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
  const shouldCache = isGet && !skipCache;

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
    const token = await getAuthToken();
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: reqHeaders,
    });
  } catch {
    throw new ClientApiError(
      0,
      `Cannot connect to Hatey Hat API at ${API_BASE}. Please ensure the server is running.`
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
  "Cleanup",
  "Plantation",
  "Donation",
  "Food Distribution",
  "Blood Donation",
  "Education",
  "Health Camp",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface EventItem {
  _id: string;
  title: string;
  description: string;
  eventType: EventType;
  thumbnail: string;
  location: string;
  eventDate: string;
  creatorEmail: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  participants?: number;
}

export interface JoinItem {
  _id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventThumbnail: string;
  eventLocation: string;
  eventType: EventType;
  userEmail: string;
  userName: string;
  joinedAt: string;
}
