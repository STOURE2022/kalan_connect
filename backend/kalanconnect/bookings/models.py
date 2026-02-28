"""
KalanConnect — Modèles Réservations, Avis, Packs & Signalements
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class Booking(models.Model):
    """Réservation d'un cours"""

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        CONFIRMED = "confirmed", "Confirmé"
        CANCELLED = "cancelled", "Annulé"
        COMPLETED = "completed", "Terminé"
        NO_SHOW = "no_show", "Absent"

    class LocationType(models.TextChoices):
        AT_TEACHER = "at_teacher", "Chez le professeur"
        AT_STUDENT = "at_student", "Chez l'élève"
        ONLINE = "online", "En ligne"

    teacher = models.ForeignKey(
        "teachers.TeacherProfile",
        on_delete=models.CASCADE,
        related_name="bookings_received",
    )
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings_made",
    )
    subject = models.ForeignKey(
        "teachers.Subject",
        on_delete=models.SET_NULL,
        null=True,
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    location_type = models.CharField(
        max_length=20,
        choices=LocationType.choices,
        default=LocationType.AT_STUDENT,
    )
    address = models.CharField(max_length=255, blank=True)
    price = models.PositiveIntegerField(help_text="Prix en FCFA")
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings"
        ordering = ["-date", "-start_time"]

    def __str__(self):
        return (
            f"Réservation {self.parent} → {self.teacher} "
            f"le {self.date} {self.start_time}"
        )


class Review(models.Model):
    """Avis sur un professeur après un cours"""

    teacher = models.ForeignKey(
        "teachers.TeacherProfile",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_given",
    )
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name="review",
    )
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]
        unique_together = ["teacher", "parent", "booking"]

    def __str__(self):
        return f"{self.parent} → {self.teacher}: {self.rating}/5"


class BookingPack(models.Model):
    """Pack / formule de cours"""

    class PackType(models.TextChoices):
        SINGLE = "single", "Cours unique"
        PACK_4 = "pack_4", "Pack 4 cours"
        PACK_8 = "pack_8", "Pack 8 cours"
        MONTHLY = "monthly", "Mensuel (12 cours)"

    class Status(models.TextChoices):
        ACTIVE = "active", "Actif"
        EXHAUSTED = "exhausted", "Épuisé"
        EXPIRED = "expired", "Expiré"

    pack_type = models.CharField(
        max_length=10,
        choices=PackType.choices,
        default=PackType.SINGLE,
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="booking_packs",
    )
    teacher = models.ForeignKey(
        "teachers.TeacherProfile",
        on_delete=models.CASCADE,
        related_name="packs_received",
    )
    subject = models.ForeignKey(
        "teachers.Subject",
        on_delete=models.SET_NULL,
        null=True,
    )
    total_sessions = models.PositiveIntegerField()
    used_sessions = models.PositiveIntegerField(default=0)
    price_per_session = models.PositiveIntegerField(help_text="Prix unitaire en FCFA")
    total_price = models.PositiveIntegerField(help_text="Prix total en FCFA")
    discount_percent = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "booking_packs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.buyer} — {self.get_pack_type_display()} ({self.used_sessions}/{self.total_sessions})"

    @property
    def remaining_sessions(self):
        return self.total_sessions - self.used_sessions

    def use_session(self):
        self.used_sessions += 1
        if self.used_sessions >= self.total_sessions:
            self.status = self.Status.EXHAUSTED
        self.save(update_fields=["used_sessions", "status"])

    def check_expired(self):
        if self.expires_at and timezone.now() > self.expires_at:
            self.status = self.Status.EXPIRED
            self.save(update_fields=["status"])
            return True
        return False


class Report(models.Model):
    """Signalement d'un utilisateur"""

    class Reason(models.TextChoices):
        BAD_BEHAVIOR = "bad_behavior", "Mauvais comportement"
        NO_SHOW = "no_show", "Absence"
        INAPPROPRIATE = "inappropriate", "Contenu inapproprié"
        FRAUD = "fraud", "Fraude"
        LOW_QUALITY = "low_quality", "Qualité insuffisante"
        OTHER = "other", "Autre"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        REVIEWED = "reviewed", "Examiné"
        RESOLVED = "resolved", "Résolu"
        DISMISSED = "dismissed", "Rejeté"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_made",
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_received",
    )
    booking = models.ForeignKey(
        Booking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
    )
    reason = models.CharField(
        max_length=20,
        choices=Reason.choices,
    )
    description = models.TextField(max_length=1000)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reports"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Signalement de {self.reporter} → {self.reported_user} ({self.get_reason_display()})"
