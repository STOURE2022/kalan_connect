"""
KalanConnect — Modèles Professeurs, Matières, Niveaux
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Subject(models.Model):
    """Matière enseignée (Maths, Français, Physique, etc.)"""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Nom de l'icône")
    category = models.CharField(
        max_length=50,
        choices=[
            ("sciences", "Sciences"),
            ("lettres", "Lettres"),
            ("langues", "Langues"),
            ("arts", "Arts"),
            ("informatique", "Informatique"),
            ("autre", "Autre"),
        ],
        default="autre",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "subjects"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Level(models.Model):
    """Niveau scolaire"""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    order = models.PositiveIntegerField(
        default=0,
        help_text="Ordre d'affichage",
    )

    class Meta:
        db_table = "levels"
        ordering = ["order"]

    def __str__(self):
        return self.name


class TeacherProfile(models.Model):
    """Profil complet d'un professeur"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_profile",
    )
    bio = models.TextField(
        max_length=2000,
        help_text="Présentation du professeur",
    )
    photo = models.ImageField(upload_to="teachers/photos/")
    hourly_rate = models.PositiveIntegerField(
        help_text="Tarif horaire en FCFA",
        validators=[MinValueValidator(500), MaxValueValidator(50000)],
    )
    experience_years = models.PositiveIntegerField(default=0)

    # Localisation
    city = models.CharField(max_length=100, default="Bamako")
    neighborhood = models.CharField(max_length=100)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    radius_km = models.PositiveIntegerField(
        default=5,
        help_text="Rayon de déplacement en km",
    )

    # Matières et niveaux (relation M2M)
    subjects = models.ManyToManyField(
        Subject,
        through="TeacherSubject",
        related_name="teachers",
    )

    # Type de cours
    teaches_online = models.BooleanField(default=False)
    teaches_at_home = models.BooleanField(default=True)
    teaches_at_student = models.BooleanField(default=True)

    # Stats (dénormalisées pour performance)
    avg_rating = models.FloatField(default=0.0)
    total_reviews = models.PositiveIntegerField(default=0)
    total_bookings = models.PositiveIntegerField(default=0)
    response_time_hours = models.FloatField(
        default=24.0,
        help_text="Temps moyen de réponse en heures",
    )

    # Documents de vérification
    class IdentityDocType(models.TextChoices):
        NINA      = "nina",      "Carte NINA"
        PASSEPORT = "passeport", "Passeport"
        CNI       = "cni",       "Carte Nationale d'Identité"

    identity_document_type = models.CharField(
        max_length=10,
        choices=IdentityDocType.choices,
        blank=True,
        default="",
        help_text="Type de pièce d'identité",
    )
    identity_document = models.FileField(
        upload_to="teachers/identity/",
        blank=True,
        help_text="Scan pièce d'identité (NINA / Passeport / CNI)",
    )
    cv = models.FileField(
        upload_to="teachers/cv/",
        blank=True,
        help_text="Curriculum Vitae du professeur",
    )

    # Vérification
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_concours_specialist = models.BooleanField(
        default=False,
        help_text="Spécialiste en préparation aux concours",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "teacher_profiles"
        ordering = ["-is_featured", "-avg_rating"]

    def __str__(self):
        return f"Prof. {self.user.first_name} {self.user.last_name}"


class TeacherSubject(models.Model):
    """Relation Professeur ↔ Matière ↔ Niveau"""

    teacher = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name="teacher_subjects",
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    level = models.ForeignKey(Level, on_delete=models.CASCADE)

    class Meta:
        db_table = "teacher_subjects"
        unique_together = ["teacher", "subject", "level"]

    def __str__(self):
        return f"{self.teacher} — {self.subject} ({self.level})"


class Diploma(models.Model):
    """Diplôme d'un professeur"""

    teacher = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name="diplomas",
    )
    title = models.CharField(max_length=200)
    institution = models.CharField(max_length=200)
    year = models.PositiveIntegerField()
    document = models.FileField(
        upload_to="teachers/diplomas/",
        blank=True,
    )

    class Meta:
        db_table = "diplomas"
        ordering = ["-year"]

    def __str__(self):
        return f"{self.title} — {self.institution} ({self.year})"


class Availability(models.Model):
    """Disponibilité d'un professeur"""

    class DayOfWeek(models.IntegerChoices):
        LUNDI = 1, "Lundi"
        MARDI = 2, "Mardi"
        MERCREDI = 3, "Mercredi"
        JEUDI = 4, "Jeudi"
        VENDREDI = 5, "Vendredi"
        SAMEDI = 6, "Samedi"
        DIMANCHE = 7, "Dimanche"

    teacher = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name="availabilities",
    )
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_recurring = models.BooleanField(default=True)

    class Meta:
        db_table = "availabilities"
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return (
            f"{self.get_day_of_week_display()} "
            f"{self.start_time}–{self.end_time}"
        )
