"""
KalanConnect — Configuration Django
"""

import os
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env("SECRET_KEY", default="change-me-in-production")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = ["*"] if DEBUG else env.list("ALLOWED_HOSTS", default=[])

# ──────────────────────────────────────────────
# Applications
# ──────────────────────────────────────────────
INSTALLED_APPS = [
    # Django Channels (doit être en premier)
    "daphne",
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "django_extensions",
    "channels",
    "django_celery_beat",
    # Apps KalanConnect
    "kalanconnect.accounts",
    "kalanconnect.teachers",
    "kalanconnect.bookings",
    "kalanconnect.chat",
    "kalanconnect.payments",
    "kalanconnect.search",
    "kalanconnect.sessions",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

ASGI_APPLICATION = "config.asgi.application"
WSGI_APPLICATION = "config.wsgi.application"

# ──────────────────────────────────────────────
# Base de données — PostgreSQL + PostGIS
# ──────────────────────────────────────────────
if DEBUG and env("DB_ENGINE", default="sqlite") == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME", default="kalanconnect"),
            "USER": env("DB_USER", default="postgres"),
            "PASSWORD": env("DB_PASSWORD", default="postgres"),
            "HOST": env("DB_HOST", default="localhost"),
            "PORT": env("DB_PORT", default="5432"),
        }
    }

# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ──────────────────────────────────────────────
# REST Framework
# ──────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}

# ──────────────────────────────────────────────
# Redis & Channels
# ──────────────────────────────────────────────
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")

if DEBUG:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        },
    }
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [REDIS_URL],
            },
        },
    }
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            },
        }
    }

# ──────────────────────────────────────────────
# Sécurité production
# ──────────────────────────────────────────────
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# ──────────────────────────────────────────────
# Celery
# ──────────────────────────────────────────────
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=REDIS_URL)
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "Africa/Bamako"

# ──────────────────────────────────────────────
# Fichiers statiques & médias
# ──────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ──────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000"],
)

# ──────────────────────────────────────────────
# Internationalisation
# ──────────────────────────────────────────────
LANGUAGE_CODE = "fr"
TIME_ZONE = "Africa/Bamako"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ──────────────────────────────────────────────
# Orange Money
# ──────────────────────────────────────────────
ORANGE_MONEY_MERCHANT_KEY = env("ORANGE_MONEY_MERCHANT_KEY", default="")
ORANGE_MONEY_API_URL = env(
    "ORANGE_MONEY_API_URL",
    default="https://api.orange.com/orange-money-webpay/ml/v1",
)
ORANGE_MONEY_RETURN_URL = env("ORANGE_MONEY_RETURN_URL", default="")
ORANGE_MONEY_CANCEL_URL = env("ORANGE_MONEY_CANCEL_URL", default="")
ORANGE_MONEY_NOTIF_URL = env("ORANGE_MONEY_NOTIF_URL", default="")

# ──────────────────────────────────────────────
# Plans d'abonnement
# ──────────────────────────────────────────────
# ──────────────────────────────────────────────
# Packs de cours (formules)
# ──────────────────────────────────────────────
BOOKING_PACKS = {
    "single": {"sessions": 1, "discount": 0},
    "pack_4": {"sessions": 4, "discount": 10},    # -10%
    "pack_8": {"sessions": 8, "discount": 15},    # -15%
    "monthly": {"sessions": 12, "discount": 20},  # -20%
}

SUBSCRIPTION_PLANS = {
    "monthly": {
        "name": "Mensuel",
        "price": 1500,  # FCFA
        "duration_days": 30,
    },
    "annual": {
        "name": "Annuel",
        "price": 15000,  # FCFA (10 mois = 2 mois offerts)
        "duration_days": 365,
    },
    "concours": {
        "name": "Préparation Concours",
        "price": 3500,  # FCFA (3 mois — économie de 1000 FCFA vs mensuel)
        "duration_days": 90,
    },
}

# Nombre de messages gratuits avant qu'un abonnement soit requis
FREE_MESSAGES_LIMIT = 3

# ──────────────────────────────────────────────
# Celery Beat — Tâches planifiées
# ──────────────────────────────────────────────
from celery.schedules import crontab  # noqa: E402

CELERY_BEAT_SCHEDULE = {
    # Expiration des abonnements — toutes les heures
    "check-expired-subscriptions": {
        "task": "kalanconnect.payments.tasks.check_expired_subscriptions",
        "schedule": crontab(minute=0),
    },
    # Réconciliation paiements en attente — toutes les heures
    "reconcile-pending-payments": {
        "task": "kalanconnect.payments.tasks.reconcile_pending_payments",
        "schedule": crontab(minute=30),
    },
    # Rappel expiration abonnement — quotidien à 9h00
    "subscription-expiry-reminder": {
        "task": "kalanconnect.payments.tasks.send_subscription_expiry_reminder",
        "schedule": crontab(hour=9, minute=0),
    },
    # Alertes concours J-7 / J-1 — quotidien à 8h00
    "send-concours-alerts": {
        "task": "kalanconnect.sessions.tasks.send_concours_alerts",
        "schedule": crontab(hour=8, minute=0),
    },
    # Clôture automatique sessions expirées — toutes les heures
    "mark-completed-sessions": {
        "task": "kalanconnect.sessions.tasks.mark_completed_sessions",
        "schedule": crontab(minute=0),
    },
}
