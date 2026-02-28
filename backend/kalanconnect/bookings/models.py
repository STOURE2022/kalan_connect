"""
KalanConnect — Modèles Réservations & Avis
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


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
