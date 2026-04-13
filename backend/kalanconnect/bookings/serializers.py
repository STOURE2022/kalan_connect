"""
KalanConnect — Serializers Réservations, Avis, Packs & Signalements
"""

from django.conf import settings
from rest_framework import serializers

from kalanconnect.accounts.serializers import UserMinimalSerializer
from kalanconnect.teachers.serializers import SubjectSerializer

from .models import Booking, BookingPack, Report, Review


class BookingSerializer(serializers.ModelSerializer):
    """Serializer complet pour une réservation"""

    parent = UserMinimalSerializer(read_only=True)
    teacher_name = serializers.CharField(
        source="teacher.user.get_full_name",
        read_only=True,
    )
    teacher_user_id = serializers.IntegerField(
        source="teacher.user.id",
        read_only=True,
    )
    teacher_phone = serializers.CharField(
        source="teacher.user.phone",
        read_only=True,
    )
    teacher_city = serializers.CharField(
        source="teacher.user.city",
        read_only=True,
        default=None,
    )
    teacher_avatar = serializers.SerializerMethodField()

    def get_teacher_avatar(self, obj):
        request = self.context.get("request")
        avatar = obj.teacher.user.avatar
        if not avatar:
            return None
        if request:
            return request.build_absolute_uri(avatar.url)
        return avatar.url
    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "teacher",
            "teacher_user_id",
            "teacher_name",
            "teacher_phone",
            "teacher_city",
            "teacher_avatar",
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
        user = self.context["request"].user
        # Vérifier que le booking est bien terminé
        booking = data["booking"]
        if booking.status != "completed":
            raise serializers.ValidationError(
                "Vous ne pouvez laisser un avis que pour un cours terminé."
            )
        # Parent ou étudiant peut laisser un avis
        if booking.parent != user:
            raise serializers.ValidationError(
                "Vous ne pouvez laisser un avis que pour vos propres réservations."
            )
        return data


class BookingPackSerializer(serializers.ModelSerializer):
    """Serializer complet pour un pack de cours"""

    buyer = UserMinimalSerializer(read_only=True)
    teacher = serializers.IntegerField(source="teacher.id", read_only=True)
    teacher_name = serializers.CharField(
        source="teacher.user.get_full_name",
        read_only=True,
    )
    subject = serializers.IntegerField(source="subject.id", read_only=True)
    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True,
    )
    remaining_sessions = serializers.SerializerMethodField()

    class Meta:
        model = BookingPack
        fields = [
            "id",
            "pack_type",
            "buyer",
            "teacher",
            "teacher_name",
            "subject",
            "subject_name",
            "total_sessions",
            "used_sessions",
            "remaining_sessions",
            "price_per_session",
            "total_price",
            "discount_percent",
            "status",
            "expires_at",
            "created_at",
        ]
        read_only_fields = [
            "id", "buyer", "total_sessions", "used_sessions",
            "price_per_session", "total_price", "discount_percent",
            "status", "expires_at", "created_at",
        ]

    def get_remaining_sessions(self, obj):
        return obj.total_sessions - obj.used_sessions


class BookingPackCreateSerializer(serializers.Serializer):
    """Création d'un pack de cours"""

    pack_type = serializers.ChoiceField(choices=BookingPack.PackType.choices)
    teacher = serializers.IntegerField()
    subject = serializers.IntegerField()

    def validate(self, data):
        from kalanconnect.teachers.models import TeacherProfile, Subject

        try:
            data["teacher_obj"] = TeacherProfile.objects.get(pk=data["teacher"])
        except TeacherProfile.DoesNotExist:
            raise serializers.ValidationError("Professeur introuvable.")

        try:
            data["subject_obj"] = Subject.objects.get(pk=data["subject"])
        except Subject.DoesNotExist:
            raise serializers.ValidationError("Matière introuvable.")

        return data

    def create(self, validated_data):
        from datetime import timedelta
        from django.utils import timezone

        pack_config = settings.BOOKING_PACKS[validated_data["pack_type"]]
        teacher = validated_data["teacher_obj"]
        total_sessions = pack_config["sessions"]
        discount = pack_config["discount"]
        price_per_session = teacher.hourly_rate
        total_price = int(price_per_session * total_sessions * (100 - discount) / 100)

        expires_at = None
        if validated_data["pack_type"] == "monthly":
            expires_at = timezone.now() + timedelta(days=30)
        elif validated_data["pack_type"] in ("pack_4", "pack_8"):
            expires_at = timezone.now() + timedelta(days=90)

        return BookingPack.objects.create(
            pack_type=validated_data["pack_type"],
            buyer=self.context["request"].user,
            teacher=teacher,
            subject=validated_data["subject_obj"],
            total_sessions=total_sessions,
            price_per_session=price_per_session,
            total_price=total_price,
            discount_percent=discount,
            expires_at=expires_at,
        )


class ReportSerializer(serializers.ModelSerializer):
    """Signalement d'un utilisateur"""

    reporter = UserMinimalSerializer(read_only=True)
    reported_user_name = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id",
            "reporter",
            "reported_user",
            "reported_user_name",
            "booking",
            "reason",
            "description",
            "status",
            "admin_notes",
            "created_at",
        ]
        read_only_fields = ["id", "reporter", "status", "admin_notes", "created_at"]

    def get_reported_user_name(self, obj):
        return f"{obj.reported_user.first_name} {obj.reported_user.last_name}"


class ReportAdminSerializer(serializers.ModelSerializer):
    """Serializer admin pour traiter un signalement"""

    reporter = UserMinimalSerializer(read_only=True)
    reported_user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "reporter",
            "reported_user",
            "booking",
            "reason",
            "description",
            "status",
            "admin_notes",
            "created_at",
        ]
        read_only_fields = ["id", "reporter", "reported_user", "booking", "reason", "description", "created_at"]
