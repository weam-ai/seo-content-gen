# Multi-stage build for React frontend

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with optimizations
RUN npm install --silent && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application with optimizations
# RUN VITE_APP_URL_PREFIX=seo-content-gen npm run build
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create optimized nginx configuration
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Handle static assets with subdirectory \
    location ~* ^/seo-content-gen/assets/(.*)$ { \
        alias /usr/share/nginx/html/assets/$1; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
        add_header Vary "Accept-Encoding"; \
    } \
    \
    # Handle subdirectory routing for HTML pages \
    location /seo-content-gen/ { \
        alias /usr/share/nginx/html/; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Handle root redirect to subdirectory \
    location = / { \
        return 301 /seo-content-gen/; \
    } \
    \
    # Handle logo and static files under seo-content-gen \
    location ~* ^/seo-content-gen/(.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$ { \
        alias /usr/share/nginx/html/$1; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
        add_header Vary "Accept-Encoding"; \
    } \
    \
    # Health check endpoint \
    location /health { \
        access_log off; \
        return 200 "healthy"; \
        add_header Content-Type text/plain; \
    } \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    \
    # Optimized gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_comp_level 6; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json application/xml image/svg+xml; \
    \
    # Error pages \
    error_page 404 /index.html; \
}' > /etc/nginx/conf.d/default.conf

# Verify nginx configuration
RUN nginx -t

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
