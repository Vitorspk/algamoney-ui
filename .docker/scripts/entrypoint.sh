#!/bin/sh
set -e

echo "==========================================>"
echo "AlgaMoney UI - Starting Application"
echo "Angular Version: 18.2.0"
echo "Environment: ${ENVIRONMENT:-production}"
echo "==========================================>"

# Replace environment variables at runtime (optional)
# If you want to substitute values at runtime, uncomment the lines below
# and configure environment variables in docker-compose.yml

# API_URL=${API_URL:-http://localhost:8080}
# echo "Configuring API URL: $API_URL"

# Replace placeholder in environment file (if exists)
# if [ -f /usr/share/nginx/html/assets/config.json ]; then
#   sed -i "s|API_URL_PLACEHOLDER|$API_URL|g" /usr/share/nginx/html/assets/config.json
# fi

echo "Starting Nginx..."
exec "$@"
