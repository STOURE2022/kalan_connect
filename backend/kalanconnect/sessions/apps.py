from django.apps import AppConfig

class SessionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "kalanconnect.sessions"
    label = "group_sessions"
    verbose_name = "Sessions de groupe"
