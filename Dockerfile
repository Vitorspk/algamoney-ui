# Stage 1: Build Angular Application
FROM node:20-alpine AS build

LABEL maintainer="AlgaMoney Team"
LABEL description="AlgaMoney UI - Angular 18 Application"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Stage 2: Nginx Server
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY .docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY .docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built artifacts from build stage
COPY --from=build /app/dist/algamoney-ui/browser /usr/share/nginx/html

# Copy entrypoint script
COPY .docker/scripts/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Execute entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
