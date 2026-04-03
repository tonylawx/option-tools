FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

# Keep tsx available at runtime because the API entrypoint runs directly from TypeScript.
RUN pnpm install --frozen-lockfile

COPY server ./server
COPY server.ts ./
COPY tsconfig.json ./
COPY next.config.ts ./

EXPOSE 3001

CMD ["pnpm", "run", "api:start"]
