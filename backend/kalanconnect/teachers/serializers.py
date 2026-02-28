"""
KalanConnect — Serializers Professeurs
"""

from rest_framework import serializers

from kalanconnect.accounts.serializers import UserMinimalSerializer

from .models import (
    Availability,
    Diploma,
    Level,
    Subject,
    TeacherProfile,
    TeacherSubject,
)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "slug", "icon", "category"]


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = ["id", "name", "slug", "order"]


class DiplomaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diploma
        fields = ["id", "title", "institution", "year", "document"]


class AvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = Availability
        fields = ["id", "day_of_week", "day_name", "start_time", "end_time", "is_recurring"]


class TeacherSubjectSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    level = LevelSerializer(read_only=True)

    class Meta:
        model = TeacherSubject
        fields = ["subject", "level"]


class TeacherProfileListSerializer(serializers.ModelSerializer):
    """Serializer pour la liste (résultats de recherche) — léger"""

    user = UserMinimalSerializer(read_only=True)
    subjects = serializers.SerializerMethodField()
    distance_km = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = TeacherProfile
        fields = [
            "id",
            "user",
            "photo",
            "bio",
            "hourly_rate",
            "city",
            "neighborhood",
            "experience_years",
            "avg_rating",
            "total_reviews",
            "is_verified",
            "is_featured",
            "teaches_online",
            "subjects",
            "distance_km",
        ]

    def get_subjects(self, obj):
        teacher_subjects = obj.teacher_subjects.select_related("subject").all()
        return list({ts.subject.name for ts in teacher_subjects})


class TeacherProfileDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour la page profil"""

    user = UserMinimalSerializer(read_only=True)
    teacher_subjects = TeacherSubjectSerializer(many=True, read_only=True)
    diplomas = DiplomaSerializer(many=True, read_only=True)
    availabilities = AvailabilitySerializer(many=True, read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            "id",
            "user",
            "photo",
            "bio",
            "hourly_rate",
            "city",
            "neighborhood",
            "latitude",
            "longitude",
            "radius_km",
            "experience_years",
            "teaches_online",
            "teaches_at_home",
            "teaches_at_student",
            "avg_rating",
            "total_reviews",
            "total_bookings",
            "response_time_hours",
            "is_verified",
            "is_featured",
            "teacher_subjects",
            "diplomas",
            "availabilities",
            "created_at",
        ]


class TeacherProfileCreateSerializer(serializers.ModelSerializer):
    """Création/modification du profil professeur"""

    subject_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    level_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = TeacherProfile
        fields = [
            "bio",
            "photo",
            "hourly_rate",
            "city",
            "neighborhood",
            "latitude",
            "longitude",
            "radius_km",
            "experience_years",
            "teaches_online",
            "teaches_at_home",
            "teaches_at_student",
            "subject_ids",
            "level_ids",
        ]

    def create(self, validated_data):
        subject_ids = validated_data.pop("subject_ids", [])
        level_ids = validated_data.pop("level_ids", [])
        user = self.context["request"].user

        profile = TeacherProfile.objects.create(user=user, **validated_data)

        # Créer les relations matière/niveau
        for subject_id in subject_ids:
            for level_id in level_ids:
                TeacherSubject.objects.create(
                    teacher=profile,
                    subject_id=subject_id,
                    level_id=level_id,
                )

        return profile
