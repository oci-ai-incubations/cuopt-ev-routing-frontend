# ============================================================================
# CuOPT Frontend - Multi-stage Dockerfile for OKE Deployment
# ============================================================================
# syntax=docker/dockerfile:1.7

# Stage 1: Install deps on build platform (fast, avoids QEMU issues)
FROM --platform=$BUILDPLATFORM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm,id=npm-$BUILDPLATFORM \
    npm ci

# Stage 2: Build the Vite frontend on build platform
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
RUN touch .env
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Production image on target platform (linux/amd64)
FROM --platform=$TARGETPLATFORM node:20-alpine AS production

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy package files for server
COPY package*.json ./

# Install only production dependencies for the Express server
# --ignore-scripts skips the "prepare" hook which would try to run husky (a devDependency)
RUN npm ci --only=production --ignore-scripts

# Copy the Express server
COPY server/ ./server/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration (from appdeploy folder)
COPY appdeploy/nginx.conf /etc/nginx/nginx.conf

# Copy startup script (from appdeploy folder)
COPY appdeploy/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose ports
# 80 - Nginx (frontend)
# 3001 - Express API server
EXPOSE 80 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ && \
      wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start both nginx and node server
ENTRYPOINT ["/docker-entrypoint.sh"]
