"""
KalanConnect — Serializers Réservations & Avis
"""

from rest_framework import serializers

from kalanconnect.accounts.serializers import UserMinimalSerializer
from kalanconnect.teachers.serializers import SubjectSerializer

from .models import Booking, Review


class BookingSerializer(serializers.ModelSerializer):
    """Serializer complet pour une réservation"""

    parent = UserMinimalSerializer(read_only=True)
    teacher_name = serializers.CharField(
        source="teacher.user.get_full_name",
        read_only=True,
    )
    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "parent",
            "subject",
            "subject_name",
            "date",
            "start_time",
            "end_time",
            "status",
            "location_type",
            "address",
            "price",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "parent", "status", "created_at"]


class BookingCreateSerializer(serializers.ModelSerializer):
    """Création d'une réservation"""

    class Meta:
        model = Booking
        fields = [
            "teacher",
            "subject",
            "date",
            "start_time",
            "end_time",
            "location_type",
            "address",
            "notes",
        ]

    def validate(self, data):
        if data["start_time"] >= data["end_time"]:
            raise serializers.ValidationError(
                "L'heure de fin doit être après l'heure de début."
            )

        # Vérifier que le créneau n'est pas déjà pris
        conflicts = Booking.objects.filter(
            teacher=data["teacher"],
            date=data["date"],
            status__in=["pending", "confirmed"],
            start_time__lt=data["end_time"],
            end_time__gt=data["start_time"],
        )
        if conflicts.exists():
            raise serializers.ValidationError(
                "Ce créneau est déjà réservé."
            )

        return data

    def create(self, validated_data):
        parent = self.context["request"].user
        teacher = validated_data["teacher"]

        # Calculer le prix automatiquement
        duration_hours = (
            validated_data["end_time"].hour - validated_data["start_time"].hour
        )
        price = teacher.hourly_rate * max(duration_hours, 1)

        return Booking.objects.create(
            parent=parent,
            price=price,
            **validated_data,
        )


class ReviewSerializer(serializers.ModelSerializer):
    """Avis sur un professeur"""

    parent = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "teacher",
            "parent",
            "booking",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["id", "parent", "created_at"]

    def validate(self, data):
        # Vérifier que le booking est bien terminé
        booking = data["booking"]
        if booking.status != "completed":
            raise serializers.ValidationError(
                "Vous ne pouvez laisser un avis que pour un cours terminé."
            )
        if booking.parent != self.context["request"].user:
            raise serializers.ValidationError(
                "Vous ne pouvez laisser un avis que pour vos propres réservations."
            )
        return data
