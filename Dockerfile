FROM node:22-trixie-slim

WORKDIR /app

ENV NODE_ENV=production
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY server ./server
COPY shared ./shared
COPY server.ts ./
COPY tsconfig.json ./
COPY next.config.ts ./

EXPOSE 3001

CMD ["bun", "run", "api:start"]
