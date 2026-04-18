import { ensureAuthSchema } from "@tonylaw/db/auth";
import { getSql } from "@tonylaw/db/client";
import { createHash, randomBytes } from "node:crypto";
import { getSessionTokenFromCookieHeader } from "@tonylaw/auth/jwt";

type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
  email_verified_at: string | null;
};

type StoredToken = {
  id: string;
  user_id: string;
  token_hash: string;
  kind: "verify_email" | "reset_password";
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

type StoredSession = {
  id: string;
  user_id: string;
  session_token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  last_seen_at: string | null;
  created_at: string;
};

type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
};

export type LoginStatus =
  | { ok: true; user: PublicUser }
  | { ok: false; code: "EMAIL_NOT_FOUND" | "INVALID_PASSWORD" | "EMAIL_NOT_VERIFIED" };

type AuthTokenResult = {
  token: string;
  user: PublicUser;
  expiresAt: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function deriveNameFromEmail(email: string) {
  return email.split("@")[0] || "Tonylaw User";
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createTokenValue() {
  return randomBytes(32).toString("hex");
}

function futureIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function futureDaysIso(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

let bootstrapPromise: Promise<void> | null = null;

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: Boolean(user.email_verified_at)
  };
}

async function ensureBootstrapUser() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const email = process.env.AUTH_BOOTSTRAP_EMAIL;
    const password = process.env.AUTH_BOOTSTRAP_PASSWORD;
    const name = process.env.AUTH_BOOTSTRAP_NAME ?? "Tony Law";

    if (!email || !password) {
      return;
    }

    const passwordHash = await Bun.password.hash(password);

    await ensureAuthSchema();
    const sql = getSql();
    const existing = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM auth_users
    `;

    if ((existing[0]?.count ?? 0) > 0) {
      return;
    }

    await sql`
      INSERT INTO auth_users (id, email, name, role, password_hash, email_verified_at)
      VALUES (${crypto.randomUUID()}, ${normalizeEmail(email)}, ${name}, ${"admin"}, ${passwordHash}, NOW())
    `;
  })();

  return bootstrapPromise;
}

async function findUserByEmail(email: string) {
  await ensureBootstrapUser();

  const sql = getSql();
  const users = await sql<StoredUser[]>`
    SELECT id, email, name, role, password_hash, email_verified_at
    FROM auth_users
    WHERE email = ${normalizeEmail(email)}
    LIMIT 1
  `;
  return users[0] ?? null;
}

async function findUserById(id: string) {
  await ensureBootstrapUser();

  const sql = getSql();
  const users = await sql<StoredUser[]>`
    SELECT id, email, name, role, password_hash, email_verified_at
    FROM auth_users
    WHERE id = ${id}
    LIMIT 1
  `;
  return users[0] ?? null;
}

async function invalidateActiveTokens(userId: string, kind: StoredToken["kind"]) {
  const sql = getSql();
  await sql`
    UPDATE auth_email_tokens
    SET used_at = NOW()
    WHERE user_id = ${userId} AND kind = ${kind} AND used_at IS NULL
  `;
}

async function storeTokenRecord(userId: string, kind: StoredToken["kind"], expiresAt: string) {
  const token = createTokenValue();
  const tokenRecord = {
    id: crypto.randomUUID(),
    userId,
    kind,
    tokenHash: tokenHash(token),
    expiresAt
  };

  await invalidateActiveTokens(userId, kind);
  const sql = getSql();
  await sql`
    INSERT INTO auth_email_tokens (id, user_id, token_hash, kind, expires_at)
    VALUES (${tokenRecord.id}, ${tokenRecord.userId}, ${tokenRecord.tokenHash}, ${tokenRecord.kind}, ${tokenRecord.expiresAt})
  `;

  return token;
}

async function consumeToken(kind: StoredToken["kind"], rawToken: string) {
  const hashed = tokenHash(rawToken);

  const sql = getSql();
  const records = await sql<StoredToken[]>`
    SELECT id, user_id, token_hash, kind, expires_at, used_at, created_at
    FROM auth_email_tokens
    WHERE token_hash = ${hashed} AND kind = ${kind}
    LIMIT 1
  `;
  const record = records[0] ?? null;

  if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
    return null;
  }

  await sql`
    UPDATE auth_email_tokens
    SET used_at = NOW()
    WHERE id = ${record.id}
  `;
  return record;
}

export async function verifyUserCredentials(email: string, password: string): Promise<PublicUser | null> {
  const status = await getLoginStatus(email, password);
  return status.ok ? status.user : null;
}

async function findSessionByToken(rawToken: string) {
  const sql = getSql();
  const sessions = await sql<StoredSession[]>`
    SELECT id, user_id, session_token_hash, expires_at, revoked_at, last_seen_at, created_at
    FROM auth_sessions
    WHERE session_token_hash = ${tokenHash(rawToken)}
    LIMIT 1
  `;

  return sessions[0] ?? null;
}

export async function createSessionForUser(user: PublicUser) {
  await ensureBootstrapUser();

  const token = createTokenValue();
  const sessionId = crypto.randomUUID();
  const expiresAt = futureDaysIso(30);
  const sql = getSql();

  await sql`
    INSERT INTO auth_sessions (id, user_id, session_token_hash, expires_at, last_seen_at)
    VALUES (${sessionId}, ${user.id}, ${tokenHash(token)}, ${expiresAt}, NOW())
  `;

  return {
    token,
    sessionId,
    expiresAt,
    user
  };
}

export async function getSessionUserFromToken(rawToken?: string | null): Promise<PublicUser | null> {
  if (!rawToken) {
    return null;
  }

  const session = await findSessionByToken(rawToken);
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() < Date.now()) {
    return null;
  }

  const user = await findUserById(session.user_id);
  if (!user) {
    return null;
  }

  const sql = getSql();
  await sql`
    UPDATE auth_sessions
    SET last_seen_at = NOW()
    WHERE id = ${session.id}
  `;

  return toPublicUser(user);
}

export async function getSessionUserFromCookieHeader(cookieHeader?: string | null): Promise<PublicUser | null> {
  return getSessionUserFromToken(getSessionTokenFromCookieHeader(cookieHeader));
}

export async function revokeSessionToken(rawToken?: string | null) {
  if (!rawToken) {
    return;
  }

  const sql = getSql();
  await sql`
    UPDATE auth_sessions
    SET revoked_at = NOW()
    WHERE session_token_hash = ${tokenHash(rawToken)} AND revoked_at IS NULL
  `;
}

export async function revokeSessionFromCookieHeader(cookieHeader?: string | null) {
  await revokeSessionToken(getSessionTokenFromCookieHeader(cookieHeader));
}

export async function getLoginStatus(email: string, password: string): Promise<LoginStatus> {
  const user = await findUserByEmail(email);

  if (!user) {
    return { ok: false, code: "EMAIL_NOT_FOUND" };
  }

  const valid = await Bun.password.verify(password, user.password_hash);
  if (!valid) {
    return { ok: false, code: "INVALID_PASSWORD" };
  }

  const publicUser = toPublicUser(user);
  if (!publicUser.emailVerified) {
    return { ok: false, code: "EMAIL_NOT_VERIFIED" };
  }

  return { ok: true, user: publicUser };
}

export async function registerUser(input: { email: string; password: string; name?: string }) {
  await ensureBootstrapUser();

  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const name = input.name?.trim() || deriveNameFromEmail(email);

  if (!email.includes("@")) {
    throw new Error("INVALID_EMAIL");
  }

  if (password.length < 8) {
    throw new Error("WEAK_PASSWORD");
  }

  const passwordHash = await Bun.password.hash(password);
  const id = crypto.randomUUID();
  const sql = getSql();
  const existing = await sql<{ id: string }[]>`
    SELECT id
    FROM auth_users
    WHERE email = ${email}
    LIMIT 1
  `;

  if (existing.length > 0) {
    throw new Error("EMAIL_EXISTS");
  }

  await sql`
    INSERT INTO auth_users (id, email, name, role, password_hash, email_verified_at)
    VALUES (${id}, ${email}, ${name}, ${"user"}, ${passwordHash}, NULL)
  `;

  const user = {
    id,
    email,
    name,
    role: "user",
    emailVerified: false
  } satisfies PublicUser;

  return user;
}

export async function createEmailVerificationToken(email: string): Promise<AuthTokenResult | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const publicUser = toPublicUser(user);
  if (publicUser.emailVerified) {
    return null;
  }

  const expiresAt = futureIso(24);
  const token = await storeTokenRecord(publicUser.id, "verify_email", expiresAt);
  return { token, user: publicUser, expiresAt };
}

export async function verifyEmailToken(rawToken: string): Promise<PublicUser | null> {
  const record = await consumeToken("verify_email", rawToken);
  if (!record) {
    return null;
  }
  const sql = getSql();
  await sql`
    UPDATE auth_users
    SET email_verified_at = NOW()
    WHERE id = ${record.user_id}
  `;

  const user = await findUserById(record.user_id);
  return user ? toPublicUser(user) : null;
}

export async function createPasswordResetToken(email: string): Promise<AuthTokenResult | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const publicUser = toPublicUser(user);
  const expiresAt = futureIso(2);
  const token = await storeTokenRecord(publicUser.id, "reset_password", expiresAt);
  return { token, user: publicUser, expiresAt };
}

export async function resetPasswordWithToken(rawToken: string, password: string): Promise<PublicUser | null> {
  if (password.trim().length < 8) {
    throw new Error("WEAK_PASSWORD");
  }

  const record = await consumeToken("reset_password", rawToken);
  if (!record) {
    return null;
  }

  const passwordHash = await Bun.password.hash(password.trim());
  const sql = getSql();
  await sql`
    UPDATE auth_users
    SET password_hash = ${passwordHash},
        email_verified_at = COALESCE(email_verified_at, NOW())
    WHERE id = ${record.user_id}
  `;

  const user = await findUserById(record.user_id);
  return user ? toPublicUser(user) : null;
}
