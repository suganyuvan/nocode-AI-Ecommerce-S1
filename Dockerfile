# ==========================================
# STAGE 1: Build Frontend Assets with Node
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools if needed
RUN apk add --no-cache libc6-compat

# Copy package descriptors first for layer caching
COPY package.json package-lock.json ./

# Install clean dependencies
RUN npm ci --legacy-peer-deps

# Declare Build Arguments (passed by Dokploy / Docker Build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_RESEND_API_KEY
ARG VITE_ADMIN_NOTIFICATION_EMAIL
ARG VITE_RESEND_SENDER_EMAIL
ARG VITE_SITE_URL

# Expose build args as environment variables for Vite bundle
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID
ENV VITE_RESEND_API_KEY=$VITE_RESEND_API_KEY
ENV VITE_ADMIN_NOTIFICATION_EMAIL=$VITE_ADMIN_NOTIFICATION_EMAIL
ENV VITE_RESEND_SENDER_EMAIL=$VITE_RESEND_SENDER_EMAIL
ENV VITE_SITE_URL=$VITE_SITE_URL

# Copy source code and configurations
COPY tsconfig.json vite.config.ts index.html ./
COPY public/ ./public/
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY assets/ ./assets/

# 1. Generate updated SEO discovery files (sitemap, robots.txt, llms.txt)
RUN npm run generate:seo

# 2. Build production distribution bundle
RUN npm run build


# ==========================================
# STAGE 2: Lightweight High-Performance Nginx
# ==========================================
FROM nginx:1.27-alpine AS runner

# Install curl for container health check
RUN apk add --no-cache curl

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration with SPA fallback, gzip & cache controls
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port 80 (Dokploy Traefik routes to this port)
EXPOSE 80

# Health check configuration for Dokploy & Docker daemon
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/healthz || exit 1

# Start Nginx server in foreground
CMD ["nginx", "-g", "daemon off;"]
