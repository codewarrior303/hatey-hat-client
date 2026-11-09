import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/events/create",
  "/events/manage",
  "/events/joined",
  "/profile",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/")) ||
    (/^\/events\/[^/]+$/.test(pathname) && pathname !== "/events") ||
    /^\/events\/[^/]+\/edit$/.test(pathname);

  if (isProtected) {
    // Optimistic check for Better Auth session token cookie (supports standard and prefixed)
    const sessionToken =
      request.cookies.get("better-auth.session_token") ||
      request.cookies.get("__Secure-better-auth.session_token") ||
      request.cookies.get("hatey_hat.session_token") ||
      request.cookies.get("__Secure-hatey_hat.session_token");

    if (!sessionToken?.value) {
      const fullPath = search ? `${pathname}${search}` : pathname;
      const loginUrl = new URL(`/login?redirect=${encodeURIComponent(fullPath)}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/events/create",
    "/events/manage",
    "/events/joined",
    "/events/:id",
    "/events/:id/edit",
    "/profile",
  ],
};
