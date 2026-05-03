FROM node:22-alpine AS base

# --- deps ---
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# --- build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV WORKSPACE_ROOT=/workspace

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# workspace 볼륨 마운트 포인트
RUN mkdir -p /workspace && chown nextjs:nodejs /workspace
VOLUME ["/workspace"]

USER nextjs

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
