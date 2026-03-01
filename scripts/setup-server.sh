#!/bin/bash
# ══════════════════════════════════════════════
# KalanConnect — Setup serveur (à exécuter sur le VM GCP)
# Usage: sudo bash setup-server.sh
# ══════════════════════════════════════════════

set -e

DOMAIN="kalanconnect.ml"
EMAIL="admin@kalanconnect.ml"
APP_DIR="/opt/kalanconnect"

echo "══════════════════════════════════════════════"
echo "  KalanConnect — Configuration serveur"
echo "══════════════════════════════════════════════"

# ── 1. Installer Docker ──
echo "1/7 — Installation Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker compose &> /dev/null; then
    apt-get update && apt-get install -y docker-compose-v2
fi

echo "   Docker $(docker --version | cut -d' ' -f3)"

# ── 2. Cloner le projet ──
echo "2/7 — Clonage du projet..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR" && git pull
else
    git clone https://github.com/STOURE2022/kalan_connect.git "$APP_DIR"
fi
cd "$APP_DIR"

# ── 3. Configurer les variables d'environnement ──
echo "3/7 — Configuration .env..."
ENV_FILE="$APP_DIR/docker/.env"

if [ ! -f "$ENV_FILE" ]; then
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))" 2>/dev/null || openssl rand -base64 50)
    DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    REDIS_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

    cat > "$ENV_FILE" <<ENVEOF
# ── Django ──
SECRET_KEY=$SECRET_KEY
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN
DOMAIN=$DOMAIN

# ── PostgreSQL ──
DB_NAME=kalanconnect
DB_USER=kalanconnect_user
DB_PASSWORD=$DB_PASSWORD

# ── Redis ──
REDIS_PASSWORD=$REDIS_PASSWORD

# ── Orange Money (à remplir) ──
ORANGE_MONEY_CLIENT_ID=
ORANGE_MONEY_CLIENT_SECRET=
ORANGE_MONEY_MERCHANT_KEY=
ORANGE_MONEY_WEBHOOK_SECRET=
ENVEOF

    echo "   .env créé avec des mots de passe générés automatiquement"
    echo ""
    echo "   ⚠️  N'oublie pas de remplir les clés Orange Money plus tard:"
    echo "   nano $ENV_FILE"
    echo ""
else
    echo "   .env existe déjà"
fi

# ── 4. Obtenir le certificat SSL ──
echo "4/7 — Certificat SSL Let's Encrypt..."

# Créer une config Nginx temporaire (HTTP only) pour le challenge
TEMP_NGINX="$APP_DIR/docker/nginx-temp.conf"
cat > "$TEMP_NGINX" <<'NGINXEOF'
server {
    listen 80;
    server_name _;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'KalanConnect setup in progress';
        add_header Content-Type text/plain;
    }
}
NGINXEOF

# Démarrer Nginx temporairement pour le challenge SSL
docker run -d --name nginx-temp \
    -p 80:80 \
    -v "$TEMP_NGINX:/etc/nginx/conf.d/default.conf:ro" \
    -v kalanconnect_certbot_www:/var/www/certbot \
    nginx:1.27-alpine 2>/dev/null || true

sleep 3

# Obtenir le certificat
docker run --rm \
    -v kalanconnect_certbot_data:/etc/letsencrypt \
    -v kalanconnect_certbot_www:/var/www/certbot \
    certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --email "$EMAIL" --agree-tos --no-eff-email \
    --non-interactive 2>/dev/null && {
    echo "   Certificat SSL obtenu!"
} || {
    echo "   ⚠️  Impossible d'obtenir le certificat SSL."
    echo "   Vérifie que ton DNS pointe vers ce serveur."
    echo "   Tu pourras relancer: certbot certonly ..."
}

# Arrêter Nginx temporaire
docker rm -f nginx-temp 2>/dev/null || true
rm -f "$TEMP_NGINX"

# ── 5. Mapper les volumes certbot pour docker-compose ──
# Les volumes certbot créés manuellement doivent correspondre
# aux noms dans docker-compose.prod.yml

# ── 6. Construire et lancer ──
echo "5/7 — Construction et lancement..."
cd "$APP_DIR/docker"

# Copier les volumes certbot si créés avec docker run
# (docker-compose utilise ses propres préfixes de volume)

docker compose -f docker-compose.prod.yml up -d --build

echo "   Attente du démarrage des services..."
sleep 15

# ── 7. Vérifier ──
echo "6/7 — Vérification des services..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "7/7 — Création du superuser admin..."
echo "   Exécute cette commande pour créer ton admin:"
echo ""
echo "   cd $APP_DIR/docker"
echo "   docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser"
echo ""

# ── Résumé ──
echo "══════════════════════════════════════════════"
echo "  ✅ KalanConnect déployé!"
echo ""
echo "  🌐 Site web:  https://$DOMAIN"
echo "  🔧 Admin:     https://$DOMAIN/admin/"
echo "  📱 API:       https://$DOMAIN/api/v1/"
echo ""
echo "  Commandes utiles:"
echo "  ─────────────────"
echo "  Logs:     cd $APP_DIR/docker && docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart:  cd $APP_DIR/docker && docker compose -f docker-compose.prod.yml restart"
echo "  Update:   cd $APP_DIR && git pull && cd docker && docker compose -f docker-compose.prod.yml up -d --build"
echo "  Backup:   docker compose -f docker-compose.prod.yml exec postgres pg_dump -U kalanconnect_user kalanconnect > backup.sql"
echo "══════════════════════════════════════════════"
