FROM node:22-trixie-slim

WORKDIR /app

ENV NODE_ENV=production
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl unzip \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash

COPY package.json bun.lock tsconfig.base.json ./
COPY backend/api/package.json backend/api/package.json
COPY frontend/auth-web/package.json frontend/auth-web/package.json
COPY frontend/option-web/package.json frontend/option-web/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN bun install --frozen-lockfile

COPY backend/api ./backend/api
COPY packages/auth ./packages/auth
COPY packages/contracts ./packages/contracts
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3001

CMD ["/app/docker-entrypoint.sh"]
