import { NextResponse, type NextRequest } from "next/server";
import { buildSignInUrl, getAuthApiUrl } from "./shared";

const DEFAULT_PUBLIC_PATHS = ["/icon", "/apple-icon"];

export async function ensureSharedAuth(
  request: NextRequest,
  publicPaths: string[] = DEFAULT_PUBLIC_PATHS
) {
  if (!process.env.AUTH_SECRET && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next();
  }

  const response = await fetch(`${getAuthApiUrl()}/api/internal/auth/session`, {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      "x-auth-internal-key": process.env.AUTH_INTERNAL_KEY ?? ""
    },
    cache: "no-store"
  }).catch(() => null);

  if (response?.ok) {
    return NextResponse.next();
  }

  return NextResponse.redirect(buildSignInUrl(request.nextUrl.href));
}
