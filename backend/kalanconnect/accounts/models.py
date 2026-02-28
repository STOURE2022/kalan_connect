"""
KalanConnect — Modèle User personnalisé
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Manager personnalisé sans username"""

    def _create_user(self, phone, password, **extra_fields):
        if not phone:
            raise ValueError("Le numéro de téléphone est obligatoire")
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(phone, password, **extra_fields)

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self._create_user(phone, password, **extra_fields)


class User(AbstractUser):
    """Utilisateur KalanConnect (parent ou professeur)"""

    class Role(models.TextChoices):
        PARENT = "parent", "Parent"
        TEACHER = "teacher", "Professeur"
        ADMIN = "admin", "Administrateur"

    # Supprime le champ username hérité d'AbstractUser
    username = None

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.PARENT,
    )
    phone = models.CharField(max_length=20, unique=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)
    city = models.CharField(max_length=100, default="Bamako")
    neighborhood = models.CharField(
        max_length=100,
        blank=True,
        help_text="Quartier (ex: Hamdallaye, Badalabougou)",
    )
    is_phone_verified = models.BooleanField(default=False)
    fcm_token = models.CharField(
        max_length=255,
        blank=True,
        help_text="Token Firebase pour push notifications",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # On utilise le phone comme identifiant principal (adapté au Mali)
    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.phone})"

    @property
    def is_parent(self):
        return self.role == self.Role.PARENT

    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER

    @property
    def has_active_subscription(self):
        return self.subscriptions.filter(status="active").exists()
