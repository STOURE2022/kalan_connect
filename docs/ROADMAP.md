# KalanConnect — Roadmap Technique & Stratégie MVP

---

## STRATÉGIE MVP EN 4 SEMAINES

### Semaine 1 : Fondations (Backend + Auth)

**Jour 1-2 : Setup**
- [ ] Initialiser le monorepo (git, Docker Compose)
- [ ] Configurer PostgreSQL + PostGIS + Redis
- [ ] Configurer Django + DRF + JWT
- [ ] Créer le modèle User personnalisé (phone-based)
- [ ] Endpoints auth : register, login, token refresh, profil

**Jour 3-4 : Modèles métier**
- [ ] Modèles : Subject, Level, TeacherProfile, TeacherSubject, Diploma, Availability
- [ ] Commande seed_data (matières + niveaux du Mali)
- [ ] CRUD profil professeur
- [ ] Upload photo + diplômes

**Jour 5-7 : Recherche**
- [ ] Endpoint recherche avancée avec filtres (matière, niveau, ville, quartier, prix)
- [ ] Recherche géographique (PostGIS)
- [ ] Pagination + tri
- [ ] Autocomplete
- [ ] Tests unitaires des modèles et endpoints

**Livrable S1 : API backend fonctionnelle avec auth + recherche**

---

### Semaine 2 : Réservation + Paiement + Chat

**Jour 8-9 : Réservations**
- [ ] Modèle Booking avec états (pending → confirmed → completed/cancelled)
- [ ] Endpoint création réservation (avec vérification créneaux)
- [ ] Endpoints actions (confirm, cancel, complete)
- [ ] Modèle Review + endpoint avis
- [ ] Calcul automatique du prix

**Jour 10-11 : Paiement Orange Money**
- [ ] Modèles Subscription + Payment
- [ ] Intégration API Orange Money (sandbox)
- [ ] Endpoint initiation paiement
- [ ] Webhook de confirmation
- [ ] Activation automatique abonnement
- [ ] Tâche Celery d'expiration

**Jour 12-14 : Chat temps réel**
- [ ] Modèles Conversation + Message
- [ ] Django Channels + WebSocket consumer
- [ ] API REST pour l'historique
- [ ] Indicateurs de frappe + lecture
- [ ] Tests WebSocket

**Livrable S2 : Backend 100% fonctionnel**

---

### Semaine 3 : Frontend Web + Mobile

**Jour 15-17 : Web (Next.js)**
- [ ] Setup Next.js 15 + Tailwind CSS
- [ ] Page d'accueil avec barre de recherche
- [ ] Page résultats de recherche avec filtres
- [ ] Page profil professeur
- [ ] Écran de réservation
- [ ] Authentification (login/register)
- [ ] Page abonnement + intégration paiement

**Jour 18-21 : Mobile (React Native / Expo)**
- [ ] Setup Expo avec navigation (React Navigation)
- [ ] Écrans : Accueil, Recherche, Profil prof, Réservation
- [ ] Écran Chat (WebSocket)
- [ ] Écran Paiement Orange Money
- [ ] Écran Profil utilisateur
- [ ] Push notifications (Expo Notifications)
- [ ] Build APK Android

**Livrable S3 : App web + APK Android fonctionnels**

---

### Semaine 4 : Tests, Polish, Déploiement

**Jour 22-23 : Tests & Corrections**
- [ ] Tests end-to-end (Playwright pour web)
- [ ] Tests manuels sur Android (différents appareils)
- [ ] Test paiement Orange Money en sandbox
- [ ] Correction bugs critiques

**Jour 24-25 : Performance & Sécurité**
- [ ] Optimisation images (WebP, compression)
- [ ] Lazy loading
- [ ] Cache Redis des recherches
- [ ] Audit sécurité (OWASP top 10)
- [ ] Rate limiting
- [ ] CORS configuration production

**Jour 26-27 : Déploiement**
- [ ] Provisionner VPS (Hetzner 4vCPU/8GB)
- [ ] Docker Compose production
- [ ] Nginx + SSL Let's Encrypt
- [ ] Domaine kalanconnect.ml
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring (Sentry + UptimeRobot)

**Jour 28 : Lancement**
- [ ] Charger les données initiales (matières, niveaux)
- [ ] Créer 10-20 profils professeurs de test
- [ ] Publication APK sur Google Play (ou distribution directe)
- [ ] Page de lancement
- [ ] Analytics (Plausible ou Mixpanel)

**Livrable S4 : Plateforme en production !**

---

## ÉVOLUTION VERS VERSION SCALABLE (10 000+ abonnés)

### Phase 2 — Mois 2-3 : Consolidation

| Fonctionnalité | Priorité | Effort |
|----------------|----------|--------|
| Vérification identité professeurs (KYC) | Haute | 1 sem |
| Notifications SMS (Africa's Talking) | Haute | 2 jours |
| Système de favoris (sauvegarder professeurs) | Moyenne | 1 jour |
| Mode hors-ligne (PWA cache) | Moyenne | 3 jours |
| Dashboard admin (gestion users, stats) | Haute | 1 sem |
| Multi-villes (Sikasso, Ségou, Mopti) | Haute | 2 jours |
| SEO optimisation (meta tags, sitemap) | Moyenne | 2 jours |

### Phase 3 — Mois 4-6 : Growth

| Fonctionnalité | Priorité | Effort |
|----------------|----------|--------|
| Programme de parrainage (referral) | Haute | 1 sem |
| Cours en groupe (1 prof → N élèves) | Haute | 2 sem |
| Paiement par cours (pas seulement abo) | Moyenne | 1 sem |
| Vidéo intégrée (cours en ligne) | Haute | 2 sem |
| Certification professeurs (badge vérifié+) | Moyenne | 1 sem |
| Blog / Ressources éducatives | Basse | 1 sem |
| Support WhatsApp Business | Haute | 3 jours |

### Phase 4 — Mois 7-12 : Scale technique

| Composant | Action | Déclencheur |
|-----------|--------|-------------|
| **Backend** | 3 instances Django + load balancer | > 500 req/s |
| **Base de données** | Read replica PostgreSQL | > 5 000 users |
| **Cache** | Redis Cluster (3 nodes) | > 10 000 req/min |
| **Recherche** | Elasticsearch dédié | > 1 000 professeurs |
| **Médias** | CDN Cloudflare + S3 Minio | > 10 GB médias |
| **Monitoring** | Grafana + Prometheus | Dès le début scale |
| **Infrastructure** | Migration vers K3s (3 nodes) | > 10 000 users |
| **CI/CD** | GitHub Actions + staging env | Dès la Phase 3 |

---

## ARCHITECTURE CIBLE À 10 000+ UTILISATEURS

```
                 Internet
                    │
            ┌───────┴───────┐
            │  Cloudflare   │  CDN + WAF + DDoS protection
            │  (gratuit)    │
            └───────┬───────┘
                    │
            ┌───────┴───────┐
            │    Nginx      │  Load balancer + SSL
            │  (VPS front)  │
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Django 1 │ │Django 2 │ │Django 3 │   3 × API servers
   │+ Daphne │ │+ Daphne │ │+ Daphne │   (WebSocket inclus)
   └────┬────┘ └────┬────┘ └────┬────┘
        │           │           │
        └─────┬─────┘───────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────────┐
│PG     │ │Redis  │ │Celery     │
│Master │ │Sentinel│ │Workers ×3 │
│+ Read │ │3 nodes│ │+ Beat     │
│Replica│ │       │ │           │
└───────┘ └───────┘ └───────────┘

Coût estimé : ~50-100€/mois pour 10k users
```

---

## MÉTRIQUES CLÉS À SUIVRE

| Métrique | Cible MVP | Cible 6 mois | Cible 12 mois |
|----------|-----------|--------------|---------------|
| Professeurs inscrits | 50 | 500 | 2 000 |
| Parents inscrits | 100 | 2 000 | 10 000 |
| Abonnés payants | 20 | 500 | 3 000 |
| Réservations/mois | 50 | 1 000 | 5 000 |
| Revenus mensuels (FCFA) | 30k | 750k | 4.5M |
| Temps de réponse API | < 500ms | < 200ms | < 100ms |
| Uptime | 99% | 99.5% | 99.9% |
| Note Play Store | - | 4.0+ | 4.5+ |

---

## BUDGET TECHNIQUE ESTIMÉ

### Phase MVP (Mois 1)
| Poste | Coût mensuel |
|-------|-------------|
| VPS Hetzner (CX31) | ~10€ |
| Domaine .ml | Gratuit (via Point ML) |
| SSL Let's Encrypt | Gratuit |
| Cloudflare (gratuit) | 0€ |
| Google Play (unique) | 25$ |
| Orange Money sandbox | Gratuit |
| **Total** | **~15€/mois** |

### Phase Scale (10k users)
| Poste | Coût mensuel |
|-------|-------------|
| 3 VPS Hetzner | ~30€ |
| Object Storage | ~5€ |
| Monitoring (Sentry) | ~26$ |
| SMS Africa's Talking | ~50$ |
| CDN + domaine | ~5€ |
| **Total** | **~100€/mois** |

### Rentabilité
- Avec 3 000 abonnés × 1 500 FCFA = **4 500 000 FCFA/mois (~6 850€)**
- Coût technique : ~100€/mois
- **Marge technique : >98%**

---

## RISQUES ET MITIGATION

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Connectivité faible (3G) au Mali | Élevé | Images optimisées, PWA cache, mode léger |
| Adoption Orange Money | Élevé | Tester en sandbox, support USSD, tutoriel vidéo |
| Confiance professeurs (profils faux) | Élevé | Vérification KYC, système d'avis, badge vérifié |
| Concurrence (Superprof, word-of-mouth) | Moyen | Prix local bas (1 500 FCFA), UX mobile-first |
| Panne serveur | Moyen | Backups auto, monitoring, plan de recovery |
| Fraude paiement | Moyen | Signature webhook, réconciliation, logs |
