# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy dependencies (includes concurrently, tsx for worker)
COPY --from=deps /app/node_modules ./node_modules

# Copy built Next.js output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy prisma schema + migrations for deploy
COPY --from=builder /app/prisma ./prisma

# Copy source files needed at runtime
COPY --from=builder /app/src/workers ./src/workers
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/src/i18n ./src/i18n
COPY --from=builder /app/src/messages ./src/messages
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/middleware.ts ./src/middleware.ts

# Copy config files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/prisma.config.ts ./

# Copy and prepare entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
