# Multi-stage Dockerfile for Infoboard (Nuxt 4 / Nitro)
# Optimized for linux/arm64 (Raspberry Pi 3/4/5) and linux/amd64

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./

# Install all dependencies (clean non-interactive)
RUN npm install

COPY . .

# Build self-contained Nitro output
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Add udev / serial permissions tools if needed for USB sensors
RUN apk add --no-cache tzdata && \
    addgroup -g 1001 -S nodejs && \
    adduser -S infoboard -u 1001 -G nodejs

# Copy the standalone Nitro output
COPY --from=builder --chown=infoboard:nodejs /app/.output ./.output

# Copy public static files if needed
COPY --from=builder --chown=infoboard:nodejs /app/public ./public

USER infoboard

EXPOSE 3000

# Run standalone Nitro server entry
CMD ["node", ".output/server/index.mjs"]
