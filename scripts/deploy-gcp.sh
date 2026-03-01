#!/bin/bash
# ══════════════════════════════════════════════
# KalanConnect — Déploiement GCP Compute Engine
# Usage: bash scripts/deploy-gcp.sh
# ══════════════════════════════════════════════

set -e

# ── Configuration ──
PROJECT_ID="kalanconnect"
ZONE="europe-west1-b"
INSTANCE_NAME="kalanconnect-server"
MACHINE_TYPE="e2-small"  # 2 vCPU, 2 Go RAM (~$7/mois)
DISK_SIZE="30GB"
DOMAIN="kalanconnect.ml"

echo "══════════════════════════════════════════════"
echo "  KalanConnect — Déploiement GCP"
echo "══════════════════════════════════════════════"
echo ""

# ── Étape 1: Vérifier gcloud ──
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI non installé."
    echo "   Installe-le: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "1/6 — Configuration du projet GCP..."
gcloud config set project "$PROJECT_ID" 2>/dev/null || {
    echo "   Création du projet $PROJECT_ID..."
    gcloud projects create "$PROJECT_ID" --name="KalanConnect"
    gcloud config set project "$PROJECT_ID"
}

gcloud services enable compute.googleapis.com

# ── Étape 2: Créer le VM ──
echo "2/6 — Création du VM $INSTANCE_NAME..."
if gcloud compute instances describe "$INSTANCE_NAME" --zone="$ZONE" &>/dev/null; then
    echo "   VM déjà existant, on continue."
else
    gcloud compute instances create "$INSTANCE_NAME" \
        --zone="$ZONE" \
        --machine-type="$MACHINE_TYPE" \
        --image-family=ubuntu-2404-lts-amd64 \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size="$DISK_SIZE" \
        --tags=http-server,https-server \
        --metadata=startup-script='#!/bin/bash
            apt-get update
            apt-get install -y docker.io docker-compose-v2 git
            systemctl enable docker
            systemctl start docker
            usermod -aG docker $USER
        '
    echo "   VM créé. Attente du démarrage..."
    sleep 30
fi

# ── Étape 3: Firewall ──
echo "3/6 — Configuration firewall..."
gcloud compute firewall-rules create allow-http \
    --allow=tcp:80 --target-tags=http-server 2>/dev/null || true
gcloud compute firewall-rules create allow-https \
    --allow=tcp:443 --target-tags=https-server 2>/dev/null || true

# ── Étape 4: Obtenir l'IP ──
EXTERNAL_IP=$(gcloud compute instances describe "$INSTANCE_NAME" \
    --zone="$ZONE" --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
echo ""
echo "══════════════════════════════════════════════"
echo "  VM prêt!"
echo "  IP externe: $EXTERNAL_IP"
echo "══════════════════════════════════════════════"
echo ""

# ── Étape 5: Réserver l'IP statique ──
echo "4/6 — Réservation IP statique..."
gcloud compute addresses create kalanconnect-ip \
    --region=europe-west1 \
    --addresses="$EXTERNAL_IP" 2>/dev/null || true

# ── Étape 6: Instructions DNS ──
echo "5/6 — Configuration DNS requise"
echo ""
echo "   Configure ton DNS chez ton registrar:"
echo "   ┌────────────────────────────────────────┐"
echo "   │  Type A  │ @   │ $EXTERNAL_IP          │"
echo "   │  Type A  │ www │ $EXTERNAL_IP          │"
echo "   └────────────────────────────────────────┘"
echo ""

echo "6/6 — Connexion au serveur..."
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Pour te connecter et finaliser le déploiement:"
echo ""
echo "  gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "  Puis sur le serveur, exécute:"
echo "  bash /opt/kalanconnect/scripts/setup-server.sh"
echo "═══════════════════════════════════════════════════"
