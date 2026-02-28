"""
KalanConnect — Modèles Abonnements & Paiements Orange Money
"""

import uuid

from django.conf import settings
from django.db import models


class Subscription(models.Model):
    """Abonnement parent"""

    class Plan(models.TextChoices):
        MONTHLY = "monthly", "Mensuel — 1 500 FCFA"
        ANNUAL = "annual", "Annuel — 15 000 FCFA"

    class Status(models.TextChoices):
        ACTIVE = "active", "Actif"
        EXPIRED = "expired", "Expiré"
        CANCELLED = "cancelled", "Annulé"
        PENDING = "pending", "En attente de paiement"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.CharField(max_length=10, choices=Plan.choices)
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING,
    )
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "subscriptions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} — {self.get_plan_display()} ({self.status})"

    @property
    def price(self):
        return settings.SUBSCRIPTION_PLANS[self.plan]["price"]


class Payment(models.Model):
    """Transaction de paiement"""

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        SUCCESS = "success", "Réussi"
        FAILED = "failed", "Échoué"
        REFUNDED = "refunded", "Remboursé"

    class Provider(models.TextChoices):
        ORANGE_MONEY = "orange_money", "Orange Money"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        related_name="payments",
    )
    amount = models.PositiveIntegerField(help_text="Montant en FCFA")
    currency = models.CharField(max_length=3, default="XOF")
    provider = models.CharField(
        max_length=20,
        choices=Provider.choices,
        default=Provider.ORANGE_MONEY,
    )
    provider_tx_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="ID de transaction côté Orange Money",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    idempotency_key = models.CharField(
        max_length=100,
        unique=True,
        help_text="Clé d'idempotence pour éviter les doubles paiements",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Données additionnelles du provider",
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment {self.id} — {self.amount} {self.currency} ({self.status})"
