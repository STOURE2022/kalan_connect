"""
KalanConnect — Views Professeurs + Recherche avancée
"""

import math

from django.db.models import F, Q, Value, FloatField
from django.db.models.functions import ACos, Cos, Radians, Sin
from django_filters import rest_framework as filters
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Availability, Diploma, Level, Subject, TeacherProfile
from .serializers import (
    AvailabilitySerializer,
    DiplomaSerializer,
    LevelSerializer,
    SubjectSerializer,
    TeacherProfileCreateSerializer,
    TeacherProfileDetailSerializer,
    TeacherProfileListSerializer,
)


# ──────────────────────────────────────────────
# Matières & Niveaux (publics)
# ──────────────────────────────────────────────


class SubjectListView(generics.ListAPIView):
    """GET /api/v1/teachers/subjects/ — Liste des matières"""

    queryset = Subject.objects.filter(is_active=True)
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class LevelListView(generics.ListAPIView):
    """GET /api/v1/teachers/levels/ — Liste des niveaux"""

    queryset = Level.objects.all()
    serializer_class = LevelSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


# ──────────────────────────────────────────────
# Profil Professeur
# ──────────────────────────────────────────────


class TeacherProfileCreateView(generics.CreateAPIView):
    """POST /api/v1/teachers/profile/ — Créer son profil professeur"""

    serializer_class = TeacherProfileCreateSerializer

    def perform_create(self, serializer):
        serializer.save()


class TeacherProfileDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/teachers/<id>/ — Détail profil professeur"""

    queryset = TeacherProfile.objects.select_related("user").prefetch_related(
        "teacher_subjects__subject",
        "teacher_subjects__level",
        "diplomas",
        "availabilities",
    )
    serializer_class = TeacherProfileDetailSerializer
    permission_classes = [permissions.AllowAny]


class MyTeacherProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/teachers/me/ — Mon profil professeur"""

    serializer_class = TeacherProfileCreateSerializer

    def get_object(self):
        return TeacherProfile.objects.get(user=self.request.user)


# ──────────────────────────────────────────────
# Diplômes
# ──────────────────────────────────────────────


class DiplomaListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/teachers/diplomas/"""

    serializer_class = DiplomaSerializer

    def get_queryset(self):
        return Diploma.objects.filter(teacher__user=self.request.user)

    def perform_create(self, serializer):
        profile = TeacherProfile.objects.get(user=self.request.user)
        serializer.save(teacher=profile)


# ──────────────────────────────────────────────
# Disponibilités
# ──────────────────────────────────────────────


class AvailabilityListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/teachers/availability/"""

    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(teacher__user=self.request.user)

    def perform_create(self, serializer):
        profile = TeacherProfile.objects.get(user=self.request.user)
        serializer.save(teacher=profile)


# ──────────────────────────────────────────────
# 🔍 RECHERCHE AVANCÉE DE PROFESSEURS
# ──────────────────────────────────────────────


class TeacherFilter(filters.FilterSet):
    """Filtres pour la recherche de professeurs"""

    subject = filters.CharFilter(
        field_name="teacher_subjects__subject__slug",
        lookup_expr="exact",
    )
    level = filters.CharFilter(
        field_name="teacher_subjects__level__slug",
        lookup_expr="exact",
    )
    city = filters.CharFilter(field_name="city", lookup_expr="iexact")
    neighborhood = filters.CharFilter(
        field_name="neighborhood",
        lookup_expr="icontains",
    )
    min_rate = filters.NumberFilter(field_name="hourly_rate", lookup_expr="gte")
    max_rate = filters.NumberFilter(field_name="hourly_rate", lookup_expr="lte")
    min_rating = filters.NumberFilter(field_name="avg_rating", lookup_expr="gte")
    online = filters.BooleanFilter(field_name="teaches_online")
    verified = filters.BooleanFilter(field_name="is_verified")

    class Meta:
        model = TeacherProfile
        fields = []


class TeacherSearchView(generics.ListAPIView):
    """
    GET /api/v1/teachers/search/

    Recherche avancée de professeurs avec filtres.

    Paramètres de requête :
    - subject : slug de la matière (ex: "mathematiques")
    - level : slug du niveau (ex: "college")
    - city : ville (ex: "Bamako")
    - neighborhood : quartier (recherche partielle)
    - min_rate / max_rate : fourchette de prix
    - min_rating : note minimale
    - online : true/false
    - verified : true/false
    - lat / lng / radius : recherche géographique
    - q : recherche textuelle (nom, bio)
    - ordering : tri (ex: "-avg_rating", "hourly_rate", "-total_reviews")
    """

    serializer_class = TeacherProfileListSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = TeacherFilter
    search_fields = ["user__first_name", "user__last_name", "bio", "neighborhood"]
    ordering_fields = [
        "avg_rating",
        "hourly_rate",
        "total_reviews",
        "experience_years",
        "created_at",
    ]
    ordering = ["-is_featured", "-avg_rating"]

    def get_queryset(self):
        qs = (
            TeacherProfile.objects.select_related("user")
            .prefetch_related("teacher_subjects__subject")
            .filter(user__is_active=True)
        )

        # Recherche textuelle
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(user__first_name__icontains=q)
                | Q(user__last_name__icontains=q)
                | Q(bio__icontains=q)
                | Q(neighborhood__icontains=q)
            )

        # Recherche géographique (par proximité — formule Haversine)
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        radius_km = float(self.request.query_params.get("radius", 10))

        if lat and lng:
            lat_f = float(lat)
            lng_f = float(lng)
            # Haversine via ORM
            qs = qs.filter(
                latitude__isnull=False, longitude__isnull=False
            ).annotate(
                distance_km=Value(6371.0, output_field=FloatField())
                * ACos(
                    Cos(Radians(Value(lat_f)))
                    * Cos(Radians(F("latitude")))
                    * Cos(Radians(F("longitude")) - Radians(Value(lng_f)))
                    + Sin(Radians(Value(lat_f))) * Sin(Radians(F("latitude")))
                )
            ).filter(distance_km__lte=radius_km).order_by("distance_km")

        return qs.distinct()


# ──────────────────────────────────────────────
# Endpoint de recherche rapide (autocomplete)
# ──────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def teacher_autocomplete(request):
    """
    GET /api/v1/teachers/autocomplete/?q=mat

    Retourne les suggestions de matières et professeurs
    pour l'autocomplete de la barre de recherche.
    """
    q = request.query_params.get("q", "").strip()
    if len(q) < 2:
        return Response({"subjects": [], "teachers": []})

    subjects = Subject.objects.filter(
        Q(name__icontains=q) | Q(category__icontains=q),
        is_active=True,
    )[:5]

    teachers = TeacherProfile.objects.filter(
        Q(user__first_name__icontains=q) | Q(user__last_name__icontains=q),
        user__is_active=True,
    ).select_related("user")[:5]

    return Response(
        {
            "subjects": SubjectSerializer(subjects, many=True).data,
            "teachers": TeacherProfileListSerializer(teachers, many=True).data,
        }
    )
