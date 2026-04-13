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
            "is_concours_specialist",
            "teaches_online",
            "teaches_at_home",
            "teaches_at_student",
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
    verification_checklist = serializers.SerializerMethodField()

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
            "is_concours_specialist",
            "identity_document_type",
            "identity_document",
            "cv",
            "verification_checklist",
            "teacher_subjects",
            "diplomas",
            "availabilities",
            "created_at",
        ]

    def get_verification_checklist(self, obj):
        request = self.context.get("request")
        def url(field):
            if not field:
                return None
            if request:
                return request.build_absolute_uri(field.url)
            return field.url
        return {
            "photo":    {"ok": bool(obj.photo),             "url": url(obj.photo)},
            "identity": {"ok": bool(obj.identity_document), "url": url(obj.identity_document), "type": obj.identity_document_type},
            "diploma":  {"ok": obj.diplomas.filter(document__gt="").exists(), "count": obj.diplomas.count()},
            "cv":       {"ok": bool(obj.cv),                "url": url(obj.cv)},
        }


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
            "is_concours_specialist",
            "identity_document_type",
            "identity_document",
            "cv",
            "subject_ids",
            "level_ids",
        ]
        extra_kwargs = {
            "photo":              {"required": False, "allow_null": True},
            "neighborhood":       {"required": False, "allow_blank": True},
            "identity_document":  {"required": False, "allow_null": True},
            "identity_document_type": {"required": False, "allow_blank": True},
            "cv":                 {"required": False, "allow_null": True},
        }

    def _sync_subjects(self, profile, subject_ids, level_ids):
        """Remplace toutes les relations matière/niveau du profil."""
        profile.teacher_subjects.all().delete()
        for subject_id in subject_ids:
            for level_id in level_ids:
                TeacherSubject.objects.create(
                    teacher=profile,
                    subject_id=subject_id,
                    level_id=level_id,
                )

    def create(self, validated_data):
        subject_ids = validated_data.pop("subject_ids", [])
        level_ids = validated_data.pop("level_ids", [])
        user = self.context["request"].user
        profile = TeacherProfile.objects.create(user=user, **validated_data)
        self._sync_subjects(profile, subject_ids, level_ids)
        return profile

    def update(self, instance, validated_data):
        subject_ids = validated_data.pop("subject_ids", None)
        level_ids = validated_data.pop("level_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if subject_ids is not None and level_ids is not None:
            self._sync_subjects(instance, subject_ids, level_ids)
        return instance
