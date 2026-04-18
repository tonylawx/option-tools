import type { NextRequest } from "next/server";
import { ensureSharedAuth } from "@tonylaw/auth/middleware";

export async function middleware(request: NextRequest) {
  return ensureSharedAuth(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
