# Multi-stage Dockerfile for Infoboard (Nuxt 4 / Nitro)
# Optimized for linux/arm64 (Raspberry Pi 3/4/5) and linux/amd64

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native node-gyp bindings (e.g. i2c-bus, @serialport)
RUN apk add --no-cache python3 make g++ linux-headers

COPY package.json package-lock.json* ./

# Install all dependencies (clean non-interactive)
RUN npm install

COPY . .

# Build self-contained Nitro output and ensure compiled i2c-bus native addon & runtime helpers are preserved
ENV NODE_ENV=production
RUN npm run build && \
    cp -r node_modules/i2c-bus node_modules/bindings node_modules/file-uri-to-path .output/server/node_modules/

# Stage 2: Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_PATH=/app/.output/server/node_modules

# Add runtime tools and configure non-root user (1001:1001) with i2c group membership (GID 988)
RUN apk add --no-cache tzdata && \
    addgroup -g 1001 -S nodejs && \
    addgroup -g 988 -S i2c && \
    adduser -S infoboard -u 1001 -G nodejs && \
    addgroup infoboard i2c

# Copy the standalone Nitro output
COPY --from=builder --chown=infoboard:nodejs /app/.output ./.output
RUN ln -s /app/.output/server/node_modules /app/node_modules

# Copy public static files if needed
COPY --from=builder --chown=infoboard:nodejs /app/public ./public

USER infoboard

EXPOSE 3000

# Run standalone Nitro server entry
CMD ["node", ".output/server/index.mjs"]
