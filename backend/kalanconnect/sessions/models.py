from django.conf import settings
from django.db import models


class ConcoursEvent(models.Model):
    """Événement concours (BAC, BEPC, ENI…) avec ses dates clés."""

    class Type(models.TextChoices):
        BAC   = "BAC",   "Baccalauréat"
        BEPC  = "BEPC",  "BEPC"
        ENI   = "ENI",   "École Nationale d'Ingénieurs"
        CAT   = "CAT",   "Certificat d'Aptitude à l'Enseignement"
        ENA   = "ENA",   "École Nationale d'Administration"
        ENAM  = "ENAM",  "ENAM"
        FMPOS = "FMPOS", "Faculté de Médecine / FMPOS"
        OTHER = "other", "Autre"

    type                    = models.CharField(max_length=10, choices=Type.choices)
    title                   = models.CharField(max_length=200)
    year                    = models.PositiveSmallIntegerField()
    date_inscription_limite = models.DateField(null=True, blank=True)
    date_examen             = models.DateField()
    description             = models.TextField(blank=True)
    is_active               = models.BooleanField(default=True)
    created_at              = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date_examen"]

    def __str__(self):
        return f"{self.type} {self.year} — {self.title}"


class GroupSession(models.Model):
    class Status(models.TextChoices):
        OPEN      = "open",      "Ouvert"
        FULL      = "full",      "Complet"
        CANCELLED = "cancelled", "Annulé"
        COMPLETED = "completed", "Terminé"

    class LocationType(models.TextChoices):
        ONLINE     = "online",     "En ligne"
        AT_TEACHER = "at_teacher", "Chez le professeur"
        OTHER      = "other",      "Autre lieu"

    teacher           = models.ForeignKey("teachers.TeacherProfile", on_delete=models.CASCADE, related_name="group_sessions")
    subject           = models.ForeignKey("teachers.Subject", on_delete=models.PROTECT, related_name="+")
    title             = models.CharField(max_length=200)
    description       = models.TextField(blank=True)
    date              = models.DateField()
    start_time        = models.TimeField()
    end_time          = models.TimeField()
    location_type     = models.CharField(max_length=20, choices=LocationType.choices, default=LocationType.ONLINE)
    address           = models.CharField(max_length=255, blank=True)
    max_participants  = models.PositiveIntegerField(default=10)
    price_per_student = models.PositiveIntegerField(default=0)
    status            = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "start_time"]

    @property
    def participants_count(self):
        return self.registrations.filter(status="registered").count()

    def sync_status(self):
        """Met à jour open/full selon le nombre d'inscrits."""
        if self.status in (self.Status.CANCELLED, self.Status.COMPLETED):
            return
        new = self.Status.FULL if self.participants_count >= self.max_participants else self.Status.OPEN
        if self.status != new:
            self.status = new
            self.save(update_fields=["status", "updated_at"])


class SessionRegistration(models.Model):
    class Status(models.TextChoices):
        REGISTERED = "registered", "Inscrit"
        CANCELLED  = "cancelled",  "Annulé"

    session    = models.ForeignKey(GroupSession, on_delete=models.CASCADE, related_name="registrations")
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="session_registrations")
    status     = models.CharField(max_length=20, choices=Status.choices, default=Status.REGISTERED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("session", "user")
        ordering = ["-created_at"]
