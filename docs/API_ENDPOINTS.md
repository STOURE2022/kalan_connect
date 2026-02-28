# KalanConnect — Liste complète des endpoints API REST

> Base URL: `https://api.kalanconnect.ml/api/v1/`
> Authentification: JWT Bearer Token (sauf endpoints publics)

---

## 1. Authentification (`/auth/`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `POST` | `/auth/register/` | Non | Inscription (retourne user + JWT tokens) |
| `POST` | `/auth/login/` | Non | Connexion (phone + password → JWT tokens) |
| `POST` | `/auth/token/refresh/` | Non | Rafraîchir le token JWT |
| `GET` | `/auth/profile/` | Oui | Mon profil |
| `PATCH` | `/auth/profile/` | Oui | Modifier mon profil (multipart pour avatar) |
| `POST` | `/auth/verify-phone/` | Oui | Vérifier téléphone (OTP) |

### Exemple — Inscription
```json
POST /auth/register/
{
    "phone": "+22370000000",
    "first_name": "Amadou",
    "last_name": "Diallo",
    "email": "amadou@email.com",
    "role": "parent",
    "city": "Bamako",
    "neighborhood": "Hamdallaye ACI 2000",
    "password": "monmotdepasse",
    "password_confirm": "monmotdepasse"
}

→ 201 Created
{
    "user": { "id": 1, "phone": "+22370000000", ... },
    "tokens": {
        "access": "eyJ0eXAi...",
        "refresh": "eyJ0eXAi..."
    }
}
```

### Exemple — Connexion
```json
POST /auth/login/
{
    "phone": "+22370000000",
    "password": "monmotdepasse"
}

→ 200 OK
{
    "access": "eyJ0eXAi...",
    "refresh": "eyJ0eXAi..."
}
```

---

## 2. Professeurs (`/teachers/`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/teachers/subjects/` | Non | Liste des matières |
| `GET` | `/teachers/levels/` | Non | Liste des niveaux scolaires |
| `POST` | `/teachers/profile/` | Oui (prof) | Créer mon profil professeur |
| `GET` | `/teachers/me/` | Oui (prof) | Mon profil professeur |
| `PATCH` | `/teachers/me/` | Oui (prof) | Modifier mon profil |
| `GET` | `/teachers/<id>/` | Non | Détail d'un professeur |
| `GET/POST` | `/teachers/diplomas/` | Oui (prof) | Mes diplômes |
| `GET/POST` | `/teachers/availability/` | Oui (prof) | Mes disponibilités |
| `GET` | `/teachers/search/` | Non | Recherche avancée |
| `GET` | `/teachers/autocomplete/` | Non | Autocomplete recherche |

### Exemple — Recherche avancée
```
GET /teachers/search/?subject=mathematiques&level=college&city=Bamako&min_rating=4&ordering=-avg_rating

→ 200 OK
{
    "count": 45,
    "next": "/teachers/search/?page=2&...",
    "results": [
        {
            "id": 12,
            "user": {
                "id": 5,
                "first_name": "Moussa",
                "last_name": "Keita",
                "avatar": "/media/avatars/moussa.jpg"
            },
            "photo": "/media/teachers/photos/moussa.jpg",
            "bio": "Professeur de mathématiques depuis 8 ans...",
            "hourly_rate": 3000,
            "city": "Bamako",
            "neighborhood": "Badalabougou",
            "experience_years": 8,
            "avg_rating": 4.8,
            "total_reviews": 32,
            "is_verified": true,
            "is_featured": false,
            "teaches_online": true,
            "subjects": ["Mathématiques", "Physique"]
        }
    ]
}
```

### Paramètres de recherche

| Paramètre | Type | Description |
|-----------|------|-------------|
| `subject` | string | Slug de la matière |
| `level` | string | Slug du niveau |
| `city` | string | Ville |
| `neighborhood` | string | Quartier (recherche partielle) |
| `min_rate` | int | Prix minimum (FCFA) |
| `max_rate` | int | Prix maximum (FCFA) |
| `min_rating` | float | Note minimale (1-5) |
| `online` | bool | Cours en ligne disponible |
| `verified` | bool | Professeur vérifié |
| `lat` | float | Latitude (recherche géo) |
| `lng` | float | Longitude (recherche géo) |
| `radius` | float | Rayon en km (défaut: 10) |
| `q` | string | Recherche textuelle |
| `ordering` | string | Tri (ex: `-avg_rating`, `hourly_rate`) |
| `page` | int | Page (20 résultats/page) |

---

## 3. Réservations (`/bookings/`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/bookings/` | Oui | Mes réservations |
| `POST` | `/bookings/create/` | Oui (parent abonné) | Créer une réservation |
| `GET` | `/bookings/<id>/` | Oui | Détail réservation |
| `POST` | `/bookings/<id>/confirm/` | Oui (prof) | Confirmer |
| `POST` | `/bookings/<id>/cancel/` | Oui (les deux) | Annuler |
| `POST` | `/bookings/<id>/complete/` | Oui (prof) | Marquer terminé |
| `POST` | `/bookings/reviews/` | Oui (parent) | Laisser un avis |
| `GET` | `/bookings/reviews/<teacher_id>/` | Non | Avis d'un professeur |

### Exemple — Créer une réservation
```json
POST /bookings/create/
Authorization: Bearer eyJ0eXAi...
{
    "teacher": 12,
    "subject": 1,
    "date": "2026-03-15",
    "start_time": "14:00",
    "end_time": "16:00",
    "location_type": "at_student",
    "address": "Hamdallaye ACI 2000, près du marché",
    "notes": "Mon fils est en 9ème année, il a des difficultés en algèbre"
}

→ 201 Created
{
    "id": 45,
    "teacher": 12,
    "teacher_name": "Moussa Keita",
    "subject": 1,
    "subject_name": "Mathématiques",
    "date": "2026-03-15",
    "start_time": "14:00:00",
    "end_time": "16:00:00",
    "status": "pending",
    "location_type": "at_student",
    "price": 6000,
    "created_at": "2026-03-10T10:30:00Z"
}
```

### Flux de statuts des réservations
```
pending → confirmed → completed
   ↓         ↓
cancelled  cancelled
```

---

## 4. Messagerie (`/chat/`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/chat/conversations/` | Oui | Mes conversations |
| `POST` | `/chat/conversations/start/` | Oui | Démarrer une conversation |
| `GET` | `/chat/conversations/<id>/messages/` | Oui | Messages d'une conversation |
| `POST` | `/chat/conversations/<id>/read/` | Oui | Marquer comme lu |

### WebSocket — Chat temps réel
```
ws://api.kalanconnect.ml/ws/chat/<conversation_id>/

// Envoyer un message
{ "type": "text", "content": "Bonjour, je cherche un prof de maths" }

// Indicateur de frappe
{ "type": "typing", "is_typing": true }

// Marquer comme lu
{ "type": "read" }

// Recevoir un message
{ "type": "message", "data": { "id": 1, "sender_id": 5, "content": "...", ... } }

// Indicateur de frappe reçu
{ "type": "typing", "user_id": 5, "is_typing": true }
```

---

## 5. Paiements & Abonnements (`/payments/`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/payments/subscriptions/` | Oui | Mes abonnements |
| `GET` | `/payments/history/` | Oui | Historique paiements |
| `POST` | `/payments/initiate/` | Oui | Initier paiement Orange Money |
| `GET` | `/payments/check-subscription/` | Oui | Vérifier abonnement actif |
| `POST` | `/payments/webhook/orange-money/` | Non (signature) | Webhook Orange Money |

### Exemple — Initier un paiement
```json
POST /payments/initiate/
Authorization: Bearer eyJ0eXAi...
{
    "plan": "monthly",
    "phone_number": "+22370000000"
}

→ 200 OK
{
    "payment_id": "a1b2c3d4-...",
    "payment_url": "https://webpayment.orange.ml/...",
    "amount": 1500,
    "currency": "XOF"
}
```

---

## 6. Recherche globale (`/search/`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/search/?q=maths&city=Bamako` | Non | Recherche globale rapide |
| `GET` | `/search/popular/?city=Bamako` | Non | Matières populaires |

---

## Codes de réponse

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide (validation) |
| 401 | Non authentifié (token manquant/expiré) |
| 403 | Non autorisé (pas de permission) |
| 404 | Ressource introuvable |
| 429 | Trop de requêtes (rate limit) |
| 500 | Erreur serveur |
| 502 | Erreur service externe (Orange Money) |
