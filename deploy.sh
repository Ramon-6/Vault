#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
# Snapvault — Script de Deploy para VPS Ubuntu
# Roda como root no servidor de produção
# ═══════════════════════════════════════════════════════════════

echo "╔══════════════════════════════════════╗"
echo "║     Snapvault — Deploy Script        ║"
echo "╚══════════════════════════════════════╝"

APP_DIR="/var/www/snapvault"
DB_NAME="snapvault_prod"
DB_USER="snapvault"
DB_PASS=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
ENCRYPTION_KEY=$(openssl rand -hex 32)
DOMAIN="${1:-}"
API_DOMAIN="${2:-}"

# ── 1. System packages ──────────────────────────────────────

echo ""
echo "▸ [1/8] Instalando dependências do sistema..."
apt-get update -qq
apt-get install -y -qq curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Node.js 20 LTS
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 20 ]]; then
  echo "  Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

# PM2
if ! command -v pm2 &> /dev/null; then
  echo "  Instalando PM2..."
  npm install -g pm2
fi

echo "  Node $(node -v) | npm $(npm -v) | PM2 $(pm2 -v)"

# ── 2. PostgreSQL ────────────────────────────────────────────

echo ""
echo "▸ [2/8] Configurando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

echo "  Banco '${DB_NAME}' pronto."

# ── 3. Clone / Pull ──────────────────────────────────────────

echo ""
echo "▸ [3/8] Preparando código..."
REPO_URL=$(git -C "$(dirname "$0")" remote get-url origin 2>/dev/null || echo "")

if [ -d "$APP_DIR" ]; then
  echo "  Atualizando código existente..."
  cd "$APP_DIR"
  git pull origin main
else
  if [ -n "$REPO_URL" ]; then
    echo "  Clonando repositório..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
  else
    echo "  Copiando arquivos locais..."
    mkdir -p "$APP_DIR"
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    rsync -a --exclude=node_modules --exclude=.git "$SCRIPT_DIR/" "$APP_DIR/"
    cd "$APP_DIR"
  fi
fi

# ── 4. Install + Build ──────────────────────────────────────

echo ""
echo "▸ [4/8] Instalando dependências e buildando..."
npm install --production=false

# Generate Prisma client
cd apps/api
cp .env.example .env

# Write production .env
FRONTEND_URL="http://localhost"
API_URL="http://localhost:3001"
if [ -n "$DOMAIN" ]; then
  FRONTEND_URL="https://${DOMAIN}"
fi
if [ -n "$API_DOMAIN" ]; then
  API_URL="https://${API_DOMAIN}"
fi

cat > .env << ENVEOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"

ENCRYPTION_KEY="${ENCRYPTION_KEY}"

B2_ACCOUNT_ID=""
B2_APPLICATION_KEY=""
B2_BUCKET_ID=""
B2_BUCKET_NAME=""

RESEND_API_KEY=""
EMAIL_FROM="Snapvault <backup@snapvault.com.br>"

NODE_ENV="production"
PORT=3001
FRONTEND_URL="${FRONTEND_URL}"
API_URL="${API_URL}"
ENVEOF

npx prisma generate
npx prisma db push --accept-data-loss
cd "$APP_DIR"

# Build frontend
cd apps/web
npx vite build
cd "$APP_DIR"

echo "  Build concluído."

# ── 5. PM2 ───────────────────────────────────────────────────

echo ""
echo "▸ [5/8] Configurando PM2..."

cat > ecosystem.config.cjs << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'snapvault-api',
    script: 'npx',
    args: 'tsx src/app.ts',
    cwd: '/var/www/snapvault/apps/api',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/snapvault/error.log',
    out_file: '/var/log/snapvault/out.log',
    time: true,
  }]
}
PM2EOF

mkdir -p /var/log/snapvault
pm2 delete snapvault-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "  API rodando na porta 3001."

# ── 6. Nginx ─────────────────────────────────────────────────

echo ""
echo "▸ [6/8] Configurando Nginx..."

SERVER_NAME="${DOMAIN:-_}"
API_SERVER_NAME="${API_DOMAIN:-_}"

cat > /etc/nginx/sites-available/snapvault << NGINXEOF
# Snapvault Frontend
server {
    listen 80;
    server_name ${SERVER_NAME};

    root ${APP_DIR}/apps/web/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/snapvault /etc/nginx/sites-enabled/snapvault
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx
systemctl enable nginx

echo "  Nginx configurado."

# ── 7. SSL (se domínio fornecido) ────────────────────────────

echo ""
echo "▸ [7/8] SSL..."

if [ -n "$DOMAIN" ]; then
  echo "  Configurando SSL para ${DOMAIN}..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" || \
    echo "  ⚠ Certbot falhou. Configure SSL manualmente depois."
else
  echo "  Nenhum domínio fornecido. Pulando SSL."
  echo "  Para configurar depois: certbot --nginx -d seudominio.com.br"
fi

# ── 8. Resumo ────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║               ✓ Deploy concluído!                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Frontend:  http://${DOMAIN:-$(hostname -I | awk '{print $1}')}"
echo "  API:       http://${DOMAIN:-$(hostname -I | awk '{print $1}')}:3001"
echo ""
echo "  PM2:       pm2 status | pm2 logs snapvault-api"
echo "  Banco:     postgresql://${DB_USER}:***@localhost:5432/${DB_NAME}"
echo ""
echo "  Credenciais salvas em: ${APP_DIR}/apps/api/.env"
echo ""
if [ -z "$DOMAIN" ]; then
  echo "  ⚠ Para SSL, rode:"
  echo "    certbot --nginx -d seudominio.com.br"
  echo ""
fi
echo "  Para atualizar: cd ${APP_DIR} && git pull && npm run build:web && pm2 restart snapvault-api"
