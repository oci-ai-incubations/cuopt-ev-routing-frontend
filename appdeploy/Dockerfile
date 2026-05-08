# ============================================================================
# CuOPT Frontend - Multi-stage Dockerfile for OKE Deployment
# ============================================================================
# syntax=docker/dockerfile:1.7
#
# Static SPA only. Backend logic was moved to cuopt-ev-routing-backend
# (FastAPI). The OKE ingress (configured in ai-accelerator-starter-packs)
# routes `/api/*` to the cuopt-backend pod and `/auth/*` to the
# accelerator-pack-auth-service pod, so this image just serves dist/ via
# nginx.

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

# Stage 3: Production image on target platform (linux/amd64) — nginx only
FROM --platform=$TARGETPLATFORM nginx:1.27-alpine AS production

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration (from appdeploy folder)
COPY appdeploy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

# Health check — index.html served by nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
