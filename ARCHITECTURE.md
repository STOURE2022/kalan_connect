# KalanConnect — Architecture Technique Complète

> Plateforme malienne de mise en relation Parents ↔ Professeurs
> Plus moderne et performante que Superprof, adaptée au contexte du Mali

---

## 1. Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐     │
│  │ Web App  │  │ Android App  │  │ Admin Dashboard       │     │
│  │ Next.js  │  │ React Native │  │ Next.js (admin)       │     │
│  └────┬─────┘  └──────┬───────┘  └───────────┬───────────┘     │
└───────┼────────────────┼─────────────────────┼──────────────────┘
        │                │                     │
        ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Nginx)                         │
│              Rate limiting, SSL, Load balancing                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌─────────────┐
│ Django REST  │ │  WebSocket  │ │  Celery     │
│ API Server   │ │  (Channels) │ │  Workers    │
│              │ │  Chat temps │ │  Tâches     │
│ Auth, CRUD,  │ │  réel       │ │  async      │
│ Search, Pay  │ │             │ │             │
└──────┬───────┘ └──────┬──────┘ └──────┬──────┘
       │                │               │
       ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                  │
│  ┌────────────┐  ┌─────────┐  ┌─────────┐  ┌───────────────┐  │
│  │ PostgreSQL │  │  Redis  │  │  S3/Minio│  │ Elasticsearch │  │
│  │ (données)  │  │ (cache, │  │ (médias) │  │ (recherche)   │  │
│  │            │  │  sessions│  │          │  │               │  │
│  │            │  │  ws)     │  │          │  │               │  │
│  └────────────┘  └─────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVICES EXTERNES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Orange Money │  │ Firebase FCM │  │ Twilio/Africa's      │  │
│  │ API          │  │ (Push notif) │  │ Talking (SMS)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Technique Recommandée

### Backend — Django 5 + Django REST Framework
**Pourquoi Django :**
- Écosystème mature, documentation excellente
- Django Channels pour WebSocket natif (chat temps réel)
- ORM puissant avec PostgreSQL
- Admin panel gratuit pour la gestion interne
- Grande communauté francophone (important pour le Mali)
- Celery intégré pour les tâches asynchrones
- Sécurité robuste par défaut (CSRF, XSS, SQL injection)

### Base de données — PostgreSQL 16
**Pourquoi PostgreSQL :**
- PostGIS pour la géolocalisation (recherche par rayon)
- Full-text search natif (recherche professeurs)
- JSONB pour les données flexibles
- Performances excellentes en lecture/écriture
- Gratuit et open-source

### Cache & Sessions — Redis
- Cache des résultats de recherche
- Sessions utilisateur
- Backend pour Django Channels (WebSocket)
- File de messages pour Celery
- Rate limiting

### Web Frontend — Next.js 15 (React)
**Pourquoi Next.js :**
- SSR pour le SEO (les parents cherchent sur Google)
- App Router avec Server Components
- Excellent performance mobile (important au Mali avec 3G)
- PWA possible (mode hors-ligne basique)
- Tailwind CSS pour un design moderne

### Mobile — React Native (Expo)
**Pourquoi React Native :**
- Partage de code avec le web (logique métier)
- Android prioritaire (90%+ du marché au Mali)
- Expo pour un développement rapide
- Performances natives
- Push notifications via Expo Notifications

### Infrastructure — Docker + VPS
**Phase MVP :**
- 1 VPS (Hetzner ou Contabo) — 4 vCPU, 8GB RAM, ~10€/mois
- Docker Compose pour orchestration
- Nginx reverse proxy + SSL Let's Encrypt
- Backups automatiques PostgreSQL

**Phase Scale (10k+ users) :**
- Kubernetes (K3s) sur 3 nodes
- CDN Cloudflare pour les assets
- PostgreSQL répliqué (read replicas)
- Redis Sentinel
- Object storage S3-compatible

### Chat temps réel — Django Channels + WebSocket
- Connexion WebSocket persistante
- Redis comme channel layer
- Indicateurs de présence (en ligne/hors-ligne)
- Indicateurs de lecture (vu/non vu)
- Historique persisté en PostgreSQL

### Notifications Push
- Firebase Cloud Messaging (FCM) pour Android
- Expo Push Notifications comme abstraction
- Notifications email via SendGrid/Mailgun
- SMS via Africa's Talking ou Orange SMS API

---

## 3. Modèle de Base de Données Complet

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    User      │────→│  TeacherProfile   │────→│   Subject    │
│              │     │                  │     │             │
│ id           │     │ id               │     │ id          │
│ email        │     │ user_id (FK)     │     │ name        │
│ phone        │     │ bio              │     │ slug        │
│ password     │     │ photo            │     │ icon        │
│ first_name   │     │ hourly_rate      │     │ category    │
│ last_name    │     │ city             │     └─────────────┘
│ role         │     │ neighborhood     │
│ is_verified  │     │ latitude         │     ┌─────────────┐
│ is_active    │     │ longitude        │     │   Level      │
│ created_at   │     │ radius_km        │     │             │
│ avatar       │     │ experience_years │     │ id          │
└──────┬──────┘     │ is_verified      │     │ name        │
       │            │ avg_rating       │     │ order       │
       │            │ total_reviews    │     └─────────────┘
       │            └────────┬─────────┘
       │                     │
       │            ┌────────┴─────────┐
       │            │ TeacherSubject   │     (M2M through)
       │            │ teacher_id (FK)  │
       │            │ subject_id (FK)  │
       │            │ level_id (FK)    │
       │            └──────────────────┘
       │
       │     ┌──────────────────┐
       │     │   Diploma        │
       │     │ id               │
       │     │ teacher_id (FK)  │
       │     │ title            │
       │     │ institution      │
       │     │ year             │
       │     │ document         │
       │     └──────────────────┘
       │
       │     ┌──────────────────┐     ┌──────────────────┐
       ├────→│  Availability    │     │    Booking       │
       │     │ id               │     │ id               │
       │     │ teacher_id (FK)  │     │ teacher_id (FK)  │
       │     │ day_of_week      │     │ parent_id (FK)   │
       │     │ start_time       │     │ subject_id (FK)  │
       │     │ end_time         │     │ date             │
       │     │ is_recurring     │     │ start_time       │
       │     └──────────────────┘     │ end_time         │
       │                              │ status           │
       │                              │ location_type    │
       │                              │ address          │
       │                              │ price            │
       │                              │ notes            │
       │                              └──────────────────┘
       │
       │     ┌──────────────────┐     ┌──────────────────┐
       ├────→│  Conversation    │────→│    Message       │
       │     │ id               │     │ id               │
       │     │ participant_1    │     │ conversation_id  │
       │     │ participant_2    │     │ sender_id (FK)   │
       │     │ last_message_at  │     │ content          │
       │     │ created_at       │     │ message_type     │
       │     └──────────────────┘     │ is_read          │
       │                              │ created_at       │
       │                              └──────────────────┘
       │
       │     ┌──────────────────┐     ┌──────────────────┐
       ├────→│  Subscription    │     │    Payment       │
       │     │ id               │     │ id               │
       │     │ user_id (FK)     │     │ user_id (FK)     │
       │     │ plan             │     │ subscription_id  │
       │     │ status           │     │ amount           │
       │     │ start_date       │     │ currency         │
       │     │ end_date         │     │ provider         │
       │     │ auto_renew       │     │ provider_tx_id   │
       │     └──────────────────┘     │ status           │
       │                              │ metadata         │
       │                              └──────────────────┘
       │
       │     ┌──────────────────┐
       └────→│    Review        │
             │ id               │
             │ teacher_id (FK)  │
             │ parent_id (FK)   │
             │ booking_id (FK)  │
             │ rating (1-5)     │
             │ comment          │
             │ created_at       │
             └──────────────────┘
```

---

## 4. Intégration Orange Money — Architecture Sécurisée

```
┌──────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│  Client  │───→│  API Backend │───→│  Orange Money   │───→│  Webhook     │
│  (app)   │    │  /payments/  │    │  API            │    │  /callback/  │
│          │    │  initiate/   │    │                 │    │              │
│          │    │              │    │  1. Initier     │    │  4. Recevoir │
│          │    │  2. Créer    │    │     paiement    │    │     statut   │
│          │    │     Payment  │    │                 │    │              │
│          │    │     pending  │    │  3. Client      │    │  5. Valider  │
│          │    │              │    │     confirme    │    │     signature│
│          │    │              │    │     sur USSD    │    │              │
│          │    │              │    │                 │    │  6. Activer  │
│          │    │              │    │                 │    │     abo      │
└──────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
```

### Flux de paiement :
1. Le parent clique "S'abonner" dans l'app
2. Le backend crée un `Payment(status=PENDING)` et appelle l'API Orange Money
3. Orange Money envoie un prompt USSD au téléphone du parent
4. Le parent confirme avec son code PIN Orange Money
5. Orange Money envoie un webhook au backend avec le résultat
6. Le backend vérifie la signature, met à jour le Payment et active la Subscription

### Sécurité :
- Vérification HMAC de chaque webhook
- Idempotency key pour éviter les doubles paiements
- Réconciliation automatique quotidienne
- Logs complets de chaque transaction
- Timeout + retry avec backoff exponentiel

---

## 5. Stratégie de Déploiement

### Phase MVP (Semaines 1-4)
```
                    ┌─────────────┐
                    │   Hetzner   │
                    │   VPS       │
                    │   4vCPU     │
                    │   8GB RAM   │
                    │   ~10€/mois │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   Docker    │
                    │   Compose   │
                    └──────┬──────┘
                           │
          ┌────────┬───────┼───────┬────────┐
          ▼        ▼       ▼       ▼        ▼
       ┌──────┐ ┌──────┐ ┌────┐ ┌──────┐ ┌──────┐
       │Nginx │ │Django│ │ PG │ │Redis │ │Celery│
       │      │ │+Chan.│ │    │ │      │ │      │
       └──────┘ └──────┘ └────┘ └──────┘ └──────┘
```

### Phase Scale (10k+ utilisateurs)
```
                    ┌──────────────┐
                    │  Cloudflare  │
                    │  CDN + WAF   │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │  K3s Cluster │
                    │  3 nodes     │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │  Node 1   │   │  Node 2   │   │  Node 3   │
    │  Django×3 │   │  Django×3 │   │  PG Master│
    │  Celery×2 │   │  Celery×2 │   │  PG Replica│
    │  Redis    │   │  Channels │   │  Redis Sen│
    └───────────┘   └───────────┘   └───────────┘
```
