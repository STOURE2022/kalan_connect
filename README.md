# KalanConnect

**La plateforme malienne de mise en relation parents-professeurs.**

Trouvez le meilleur professeur particulier au Mali — par matière, niveau, quartier et disponibilité.

---

## Architecture

| Couche | Technologie |
|--------|------------|
| Backend API | Django 5 + DRF + Django Channels (WebSocket) |
| Base de données | PostgreSQL 16 + PostGIS |
| Cache / Broker | Redis 7 |
| Tâches async | Celery + Celery Beat |
| Frontend Web | Next.js 15 (App Router) + Tailwind CSS |
| App Mobile | React Native (Expo ~52) + React Navigation |
| Paiement | Orange Money API |
| Notifications | Firebase Cloud Messaging (Expo Notifications) |
| Conteneurisation | Docker Compose |

Voir [`ARCHITECTURE.md`](./ARCHITECTURE.md) pour le détail complet.

---

## Structure du monorepo

```
KalanConnect/
├── backend/          # Django REST API + WebSocket
├── frontend/         # Next.js 15 (web)
├── mobile/           # React Native Expo (Android/iOS)
├── docker/           # Dockerfiles
├── scripts/          # Scripts utilitaires
├── docs/             # Documentation (API, UX, Roadmap)
└── docker-compose.yml
```

---

## Démarrage rapide

### Prérequis

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+ (si dev sans Docker)
- Expo CLI (`npm install -g expo-cli`)

### 1. Backend (Docker)

```bash
# Copier les variables d'environnement
cp backend/.env.example backend/.env

# Lancer les services (PostgreSQL, Redis, Backend, Celery)
docker compose up -d

# Appliquer les migrations et charger les données initiales
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
docker compose exec backend python manage.py createsuperuser
```

Le backend est accessible sur `http://localhost:8000`.
Admin Django : `http://localhost:8000/admin/`.

### 2. Frontend Web (Next.js)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Le site est accessible sur `http://localhost:3000`.

### 3. App Mobile (Expo)

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

Scanner le QR code avec Expo Go (Android) ou appuyer sur `a` pour l'émulateur Android.

> **Note :** Sur émulateur Android, l'API est accessible via `10.0.2.2:8000`.

### Script tout-en-un

```bash
chmod +x scripts/start_dev.sh
./scripts/start_dev.sh
```

---

## API

Documentation complète : [`docs/API_ENDPOINTS.md`](./docs/API_ENDPOINTS.md)

**Principaux endpoints :**

| Ressource | Endpoint | Description |
|-----------|----------|-------------|
| Auth | `POST /api/v1/auth/register/` | Inscription (téléphone) |
| Auth | `POST /api/v1/auth/login/` | Connexion (JWT) |
| Professeurs | `GET /api/v1/teachers/search/` | Recherche avec filtres |
| Réservations | `POST /api/v1/bookings/create/` | Réserver un cours |
| Chat | `WS /ws/chat/<id>/` | Messagerie temps réel |
| Paiement | `POST /api/v1/payments/initiate/` | Paiement Orange Money |

---

## Fonctionnalités

- **Recherche avancée** : par matière, niveau, ville, quartier, distance (PostGIS), tarif, note
- **Profils professeurs** : photo, bio, diplômes, matières, disponibilités, avis
- **Réservation** : calendrier, créneaux, confirmation, annulation
- **Messagerie temps réel** : WebSocket, indicateur de frappe, accusés de lecture
- **Paiement Orange Money** : webhook sécurisé (HMAC), idempotence, réconciliation Celery
- **Abonnement parents** : Mensuel (1 500 FCFA) ou Annuel (15 000 FCFA)
- **Notifications push** : Firebase Cloud Messaging via Expo

---

## Abonnements

| Plan | Prix | Durée |
|------|------|-------|
| Mensuel | 1 500 FCFA | 30 jours |
| Annuel | 15 000 FCFA | 365 jours (2 mois offerts) |

---

## Stack de développement

```
Python 3.12  •  Django 5  •  PostgreSQL 16 + PostGIS
Node.js 20   •  Next.js 15  •  React 19  •  Tailwind CSS 4
Expo ~52     •  React Native 0.76  •  TypeScript 5
Docker       •  Redis 7  •  Celery  •  Daphne (ASGI)
```

---

## Roadmap

Voir [`docs/ROADMAP.md`](./docs/ROADMAP.md) pour le plan complet.

**Phase 1 (MVP — 4 semaines) :**
- Semaine 1 : Backend core (auth, profils, recherche)
- Semaine 2 : Réservations, messagerie, paiement
- Semaine 3 : Frontend web + mobile
- Semaine 4 : Tests, déploiement, lancement beta

**Phase 2+ :** Notifications push, tableau de bord admin, analytics, app iOS, scaling K3s.

---

## Licence

Projet privé — Tous droits réservés.
