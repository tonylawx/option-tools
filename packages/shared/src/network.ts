export function isAllowedAppOrigin(origin?: string | null) {
  if (!origin) {
    return true;
  }

  try {
    const url = new URL(origin);

    if (process.env.NODE_ENV !== "production") {
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    }

    return url.hostname === "tonylaw.cc" || url.hostname.endsWith(".tonylaw.cc");
  } catch {
    return false;
  }
}

export function resolveCorsOrigin(origin?: string | null) {
  return isAllowedAppOrigin(origin) ? origin ?? "*" : null;
}
