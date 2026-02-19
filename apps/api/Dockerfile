# ─── KobKlein API — Production Dockerfile ─────────────────────────────
# Self-contained build (no monorepo lockfile needed)

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install --include=dev

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npx nest build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy only production artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nestjs

EXPOSE ${PORT:-3001}

ENV NODE_ENV=production

CMD ["node", "dist/src/main.js"]
