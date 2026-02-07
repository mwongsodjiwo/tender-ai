# ============================================================
# TenderManager AI — Production Dockerfile
# Multi-stage build for minimal production image
# ============================================================

# ----------------------------------------------------------
# Stage 1: Install ALL dependencies (including devDependencies)
# ----------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (dev + prod) needed for the build step
RUN npm ci

# ----------------------------------------------------------
# Stage 2: Build the SvelteKit application
# ----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the SvelteKit app (outputs to build/ via adapter-node)
RUN npm run build

# Prune devDependencies after build to keep only production deps
RUN npm prune --production

# ----------------------------------------------------------
# Stage 3: Production image (minimal)
# ----------------------------------------------------------
FROM node:20-alpine AS production

# Security: install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user for running the application
RUN addgroup -g 1001 -S tendermanager && \
    adduser -S tendermanager -u 1001 -G tendermanager

WORKDIR /app

# Copy only what is needed for production
COPY --from=builder --chown=tendermanager:tendermanager /app/build ./build
COPY --from=builder --chown=tendermanager:tendermanager /app/package.json ./package.json
COPY --from=builder --chown=tendermanager:tendermanager /app/node_modules ./node_modules

# Port configuration via environment variable (no hardcoded values)
ENV PORT=3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Expose the configured port
EXPOSE ${PORT}

# Health check against the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Run as non-root user
USER tendermanager

# Use dumb-init to handle PID 1 and signal forwarding
ENTRYPOINT ["dumb-init", "--"]

# Start the SvelteKit production server
CMD ["node", "build"]
