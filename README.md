# tonylaw.cc monorepo

## Frontend

- `frontend/auth-web`: shared sign-in center for all `*.tonylaw.cc`
- `frontend/option-web`: current options tool frontend

## Backend

- `backend/api`: unified Hono backend for auth and options data

## Shared packages

- `packages/auth`: shared Auth.js config and middleware
- `packages/contracts`: shared API contracts
- `packages/db`: PostgreSQL helpers and schema bootstrap
- `packages/shared`: shared i18n and app copy

## Deployment split

- Frontends: Vercel
- Backends: Render
- Database: Render PostgreSQL

## Deploy order

1. Create Render PostgreSQL first
2. Deploy `api` on Render
3. Deploy `auth-web` on Vercel
4. Deploy `option-web` on Vercel

This order keeps shared auth available before the dependent apps go live.

## Current auth topology

- Shared login app: `auth.tonylaw.cc`
- Shared public API gateway: `api.tonylaw.cc`
- Options frontend: `optix.tonylaw.cc`
- Shared cookie domain: `.tonylaw.cc`
- Auth API path: `https://api.tonylaw.cc/auth`
- Option API path: `https://api.tonylaw.cc/optix`

## Local development

```bash
bun install
bun run dev:db
bun run dev:auth
bun run dev:web
bun run dev:api
```

Local development uses Docker Postgres so it matches production more closely:

- Host: `localhost`
- Port: `5432`
- Database: `tonylaw_local`
- User: `postgres`
- Password: `postgres`

Set `DATABASE_URL=postgres://postgres:postgres@localhost:5432/tonylaw_local` in your local `.env`.

## Vercel setup

Create two separate Vercel projects from the same repository:

### `auth-web`

- Root Directory: `frontend/auth-web`
- Framework: `Next.js`
- Package manager: Bun
- Install Command: `bun install`
- Build Command: `bun run build`
- In the project settings, keep `Include source files outside of the Root Directory in the Build Step` enabled so the app can use workspace packages outside `frontend/auth-web`.

Environment variables:

- `AUTH_SECRET`
- `AUTH_INTERNAL_KEY`
- `AUTH_SESSION_COOKIE_NAME`
- `AUTH_APP_URL=https://auth.tonylaw.cc`
- `AUTH_API_URL=https://api.tonylaw.cc/auth`
- `NEXT_PUBLIC_AUTH_API_URL=https://api.tonylaw.cc/auth`
- `AUTH_COOKIE_DOMAIN=.tonylaw.cc`

Domain:

- `auth.tonylaw.cc`

### `option-web`

- Root Directory: `frontend/option-web`
- Framework: `Next.js`
- Package manager: Bun
- Install Command: `bun install`
- Build Command: `bun run build`
- Keep `Include source files outside of the Root Directory in the Build Step` enabled here as well.

Environment variables:

- `AUTH_SECRET`
- `AUTH_APP_URL=https://auth.tonylaw.cc`
- `AUTH_SESSION_COOKIE_NAME`
- `NEXT_PUBLIC_API_BASE_URL=https://api.tonylaw.cc/optix`

Domain:

- `optix.tonylaw.cc`

## Render setup

This repo already includes a Blueprint at [render.yaml](/Users/tonylaw/Documents/option/render.yaml).

### 1. Create PostgreSQL

Create a Render PostgreSQL database named `tonylaw-postgres`.

If your workspace has free Postgres available, use that. Otherwise pick the lowest available paid plan. The auth service needs this database before it can deploy successfully.

### 2. Blueprint deploy

In Render:

1. `New +`
2. `Blueprint`
3. Select this repository
4. Confirm it uses the root [render.yaml](/Users/tonylaw/Documents/option/render.yaml)

The Blueprint will create:

- `api`
- `tonylaw-postgres`

### 3. Render environment variables

#### `api`

- `SERVICE_NAME=api`
- `AUTH_SECRET`
- `AUTH_INTERNAL_KEY`
- `AUTH_SESSION_COOKIE_NAME`
- `AUTH_COOKIE_DOMAIN=.tonylaw.cc`
- `AUTH_APP_URL=https://auth.tonylaw.cc`
- `AUTH_API_URL=https://api.tonylaw.cc/auth`
- `AUTH_BOOTSTRAP_EMAIL`
- `AUTH_BOOTSTRAP_PASSWORD`
- `AUTH_BOOTSTRAP_NAME`
- `DATABASE_URL` should come from `tonylaw-postgres`
- `LONGBRIDGE_APP_KEY`
- `LONGBRIDGE_APP_SECRET`
- `LONGBRIDGE_ACCESS_TOKEN`
- `LONGBRIDGE_LANGUAGE=zh-CN`
- `RESEND_API_KEY`
- `AUTH_FROM_EMAIL=noreply@tonylaw.cc`

Custom domain:

- `api.tonylaw.cc`

## Email setup

Verification emails and password reset emails are sent from the unified `api` service.

Recommended setup:

1. Verify your sending domain in Resend
2. Set `RESEND_API_KEY` on Render `api`
3. Set `AUTH_FROM_EMAIL` to a verified sender, for example `noreply@tonylaw.cc`

If these two variables are missing, the app falls back to preview links in the API response and server logs for local testing.

## DNS checklist

- `auth.tonylaw.cc` -> Vercel project for `auth-web`
- `optix.tonylaw.cc` -> Vercel project for `option-web`
- `api.tonylaw.cc` -> Render service `api`

## Notes

- Frontend projects share auth via cookies on `.tonylaw.cc`
- The unified `api` service uses PostgreSQL for auth and Longbridge for option data
- Use a different `AUTH_SESSION_COOKIE_NAME` for each environment so staging and production do not overwrite each other's login state
