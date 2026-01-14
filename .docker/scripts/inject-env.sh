#!/bin/sh

# Script para injetar variáveis de ambiente em runtime
# Usado no Docker container startup

set -e

ENV_FILE="/usr/share/nginx/html/assets/config/env.json"

echo "Gerando configuração de runtime..."

# Cria o arquivo env.json com variáveis de ambiente
cat > "$ENV_FILE" <<EOF
{
  "apiUrl": "${API_URL:-http://localhost:8080}",
  "oauthClientId": "${OAUTH_CLIENT_ID:-angular}"
}
EOF

# Injeta OAUTH_CLIENT_SECRET como variável global JavaScript
# ATENÇÃO: Mesmo assim não é 100% seguro, o ideal é obter do backend
cat > "/usr/share/nginx/html/assets/config/env.js" <<EOF
window.__ENV = window.__ENV || {};
window.__ENV.OAUTH_CLIENT_SECRET = "${OAUTH_CLIENT_SECRET:-}";
EOF

echo "Configuração de runtime gerada com sucesso!"
echo "API URL: ${API_URL:-http://localhost:8080}"
echo "OAuth Client ID: ${OAUTH_CLIENT_ID:-angular}"
echo "OAuth Secret: [OCULTO]"