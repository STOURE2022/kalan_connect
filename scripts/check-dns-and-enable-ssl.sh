#!/bin/bash
# ══════════════════════════════════════════════
# KalanConnect — Verification DNS + Activation SSL
# Usage: bash scripts/check-dns-and-enable-ssl.sh
# ══════════════════════════════════════════════

DOMAIN="kalanconnect.ml"
EXPECTED_IP="35.195.92.169"
ZONE="europe-west1-b"
INSTANCE="kalanconnect-server"
MAX_CHECKS=120  # 120 x 30s = 1 heure max
CHECK_INTERVAL=30

echo "══════════════════════════════════════════════"
echo "  KalanConnect — DNS Check + SSL Setup"
echo "══════════════════════════════════════════════"
echo ""
echo "  Domaine:  $DOMAIN"
echo "  IP cible: $EXPECTED_IP"
echo "  Interval: toutes les ${CHECK_INTERVAL}s (max ${MAX_CHECKS} essais = 1h)"
echo ""

# ── Etape 1: Attendre la propagation DNS ──
echo "1/4 — Verification de la propagation DNS..."
echo ""

check_count=0
dns_ready=false

while [ $check_count -lt $MAX_CHECKS ]; do
    check_count=$((check_count + 1))
    timestamp=$(date +"%H:%M:%S")

    # Verifier via Google DNS-over-HTTPS
    response=$(curl -s "https://dns.google/resolve?name=${DOMAIN}&type=A" 2>/dev/null)
    resolved_ip=$(echo "$response" | grep -o '"data":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ "$resolved_ip" = "$EXPECTED_IP" ]; then
        echo "  [$timestamp] Essai $check_count — DNS PROPAGE ! $DOMAIN -> $resolved_ip"
        dns_ready=true
        break
    else
        status=$(echo "$response" | grep -o '"Status":[0-9]*' | cut -d: -f2)
        case $status in
            0) echo "  [$timestamp] Essai $check_count — Resolu mais IP incorrecte: $resolved_ip" ;;
            3) echo "  [$timestamp] Essai $check_count — Domaine pas encore resolu (NXDOMAIN)" ;;
            2) echo "  [$timestamp] Essai $check_count — Erreur serveur (SERVFAIL)" ;;
            *) echo "  [$timestamp] Essai $check_count — En attente... (status: $status)" ;;
        esac
        sleep $CHECK_INTERVAL
    fi
done

if [ "$dns_ready" = false ]; then
    echo ""
    echo "  Timeout apres $MAX_CHECKS essais."
    echo "  Le DNS n'a pas encore propage."
    echo "  Verifie la config sur Point.ml et relance ce script plus tard."
    exit 1
fi

echo ""
echo "  DNS propage avec succes !"
echo ""

# ── Etape 2: Verifier aussi www ──
echo "2/4 — Verification de www.$DOMAIN..."

www_response=$(curl -s "https://dns.google/resolve?name=www.${DOMAIN}&type=A" 2>/dev/null)
www_ip=$(echo "$www_response" | grep -o '"data":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ "$www_ip" = "$EXPECTED_IP" ]; then
    echo "  www.$DOMAIN -> $www_ip  OK"
else
    echo "  www.$DOMAIN pas encore resolu. On continue avec le domaine principal."
fi

echo ""

# ── Etape 3: Obtenir le certificat SSL ──
echo "3/4 — Obtention du certificat SSL Let's Encrypt..."
echo ""

# Construire la commande certbot
CERTBOT_CMD="cd /opt/kalanconnect/docker && sudo docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d $DOMAIN -d www.$DOMAIN --email admin@$DOMAIN --agree-tos --no-eff-email --non-interactive"

echo "  Connexion au serveur et lancement de certbot..."
echo y | gcloud compute ssh $INSTANCE --zone=$ZONE --command="$CERTBOT_CMD" 2>&1

if [ $? -ne 0 ]; then
    echo ""
    echo "  Erreur avec www.$DOMAIN. Tentative sans www..."
    CERTBOT_CMD="cd /opt/kalanconnect/docker && sudo docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d $DOMAIN --email admin@$DOMAIN --agree-tos --no-eff-email --non-interactive"
    echo y | gcloud compute ssh $INSTANCE --zone=$ZONE --command="$CERTBOT_CMD" 2>&1
fi

echo ""
echo "  Certificat SSL obtenu !"
echo ""

# ── Etape 4: Activer la config Nginx SSL ──
echo "4/4 — Activation de la configuration HTTPS..."

SWITCH_CMD="cd /opt/kalanconnect/docker && sudo cp nginx-ssl.conf nginx.conf && sudo docker compose -f docker-compose.prod.yml restart nginx"
echo y | gcloud compute ssh $INSTANCE --zone=$ZONE --command="$SWITCH_CMD" 2>&1

echo ""
echo "══════════════════════════════════════════════"
echo "  SSL active !"
echo ""
echo "  Teste maintenant :"
echo "  https://$DOMAIN"
echo "  https://$DOMAIN/admin/"
echo "  https://$DOMAIN/api/v1/teachers/subjects/"
echo "══════════════════════════════════════════════"
