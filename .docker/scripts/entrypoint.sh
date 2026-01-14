#!/bin/sh
set -e

echo "==========================================>"
echo "AlgaMoney UI - Starting Application"
echo "Angular Version: 18.2.0"
echo "Environment: ${ENVIRONMENT:-production}"
echo "==========================================>"

# Injeta variáveis de ambiente em runtime
echo "Configurando variáveis de ambiente..."
/docker-scripts/inject-env.sh

echo "Starting Nginx..."
exec "$@"
