#!/bin/bash
# KalanConnect — Script de démarrage développement

set -e

echo "🟢 Démarrage de KalanConnect (dev)..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Démarrer les services
echo "📦 Démarrage des containers Docker..."
docker compose up -d postgres redis

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
sleep 3

# Migrations
echo "🔄 Migrations..."
cd backend
python manage.py migrate

# Charger les données initiales
echo "📚 Chargement des données initiales..."
python manage.py seed_data

echo ""
echo "✅ KalanConnect est prêt !"
echo ""
echo "  Backend:  http://localhost:8000"
echo "  Admin:    http://localhost:8000/admin/"
echo "  API:      http://localhost:8000/api/v1/"
echo ""
echo "  Commandes utiles :"
echo "    python manage.py runserver              # Démarrer le backend"
echo "    python manage.py createsuperuser        # Créer un admin"
echo "    celery -A config worker -l info         # Démarrer Celery"
echo ""
