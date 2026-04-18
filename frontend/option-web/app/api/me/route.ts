import { NextResponse } from "next/server";
import { getAuthApiUrl } from "@tonylaw/auth/shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const response = await fetch(`${getAuthApiUrl()}/api/internal/auth/session`, {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      "x-auth-internal-key": process.env.AUTH_INTERNAL_KEY ?? ""
    },
    cache: "no-store"
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const session = (await response.json()) as {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };

  return NextResponse.json({
    user: {
      id: session.id ?? null,
      name: session.name ?? null,
      email: session.email ?? null,
      role: session.role ?? null
    }
  });
}
