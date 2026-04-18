import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAuthAppUrl, getAuthCookieDomain, getSessionCookieName, isProductionAuth } from "./shared";

type SharedAuthOptions = {
  apiBaseUrl?: string;
};

export function createSharedAuthOptions(options: SharedAuthOptions = {}): NextAuthOptions {
  const fallbackApiBaseUrl = process.env.NODE_ENV === "production" ? "https://api.tonylaw.cc/auth" : "http://localhost:3001/auth";
  const apiBaseUrl = (options.apiBaseUrl ?? process.env.AUTH_API_URL ?? fallbackApiBaseUrl).replace(/\/$/, "");
  const isSecure = isProductionAuth();

  return {
    secret: process.env.AUTH_SECRET,
    session: {
      strategy: "jwt"
    },
    pages: {
      signIn: "/signin"
    },
    providers: [
      CredentialsProvider({
        name: "Tonylaw Account",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials.password) {
            return null;
          }

          const response = await fetch(`${apiBaseUrl}/api/internal/auth/verify`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-auth-internal-key": process.env.AUTH_INTERNAL_KEY ?? ""
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            }),
            cache: "no-store"
          });

          if (!response.ok) {
            return null;
          }

          const user = (await response.json()) as {
            id: string;
            email: string;
            name: string;
            role: string;
          };

          return user;
        }
      })
    ],
    cookies: {
      sessionToken: {
        name: getSessionCookieName(),
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: isSecure,
          domain: isSecure ? getAuthCookieDomain() : undefined
        }
      }
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.role = (user as { role?: string }).role ?? "user";
          token.name = user.name;
          token.email = user.email;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.email = token.email;
          session.user.name = token.name;
          (session.user as { role?: string }).role = token.role as string | undefined;
        }
        return session;
      },
      async redirect({ url, baseUrl }) {
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }

        const target = new URL(url);
        const origin = new URL(baseUrl);
        const allowedHost = getAuthCookieDomain().replace(/^\./, "");

        if (target.hostname === origin.hostname || target.hostname === allowedHost || target.hostname.endsWith(`.${allowedHost}`)) {
          return target.toString();
        }

        return getAuthAppUrl();
      }
    }
  };
}
