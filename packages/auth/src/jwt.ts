import { getSessionCookieName } from "./shared";

export type SharedSessionPayload = {
  sub?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

function parseCookieHeader(cookieHeader?: string | null) {
  const cookies = new Map<string, string>();

  for (const part of (cookieHeader ?? "").split(";")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    cookies.set(name, value);
  }

  return cookies;
}

export function getSessionTokenFromCookieHeader(
  cookieHeader?: string | null,
  cookieName = getSessionCookieName()
) {
  const cookies = parseCookieHeader(cookieHeader);
  const directToken = cookies.get(cookieName);

  if (directToken) {
    return directToken;
  }

  const chunkedEntries = [...cookies.entries()]
    .filter(([name]) => name.startsWith(`${cookieName}.`))
    .sort(([left], [right]) => {
      const leftIndex = Number(left.slice(cookieName.length + 1));
      const rightIndex = Number(right.slice(cookieName.length + 1));
      return leftIndex - rightIndex;
    });

  if (chunkedEntries.length === 0) {
    return null;
  }

  return chunkedEntries.map(([, value]) => value).join("");
}
