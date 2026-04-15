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

    def _sync_subjects(self, profile, subject_levels):
        """Remplace les relations matière/niveau selon le mapping [{subject_id, level_ids}]."""
        import json
        profile.teacher_subjects.all().delete()
        for entry in subject_levels:
            subject_id = entry["subject_id"]
            for level_id in entry.get("level_ids", []):
                TeacherSubject.objects.get_or_create(
                    teacher=profile,
                    subject_id=subject_id,
                    level_id=level_id,
                )

    def _parse_subject_levels(self):
        """Lit subject_levels (JSON string) ou construit le produit croisé (rétrocompat)."""
        import json
        data = self.context["request"].data
        raw = data.get("subject_levels")
        if raw:
            try:
                return json.loads(raw)
            except (ValueError, TypeError):
                return []
        # Rétrocompat : flat subject_ids + level_ids → produit croisé
        subject_ids = data.getlist("subject_ids") or []
        level_ids   = data.getlist("level_ids")   or []
        if subject_ids and level_ids:
            return [{"subject_id": int(sid), "level_ids": [int(lid) for lid in level_ids]}
                    for sid in subject_ids]
        return []

    def _notify_admins(self, profile, is_update=False):
        """Envoie une notification à tous les admins quand un profil est soumis."""
        try:
            from django.contrib.auth import get_user_model
            from kalanconnect.chat.models import AppNotification
            User = get_user_model()
            teacher_name = f"{profile.user.first_name} {profile.user.last_name}"
            title = "Profil mis à jour — à re-vérifier" if is_update else "Nouveau profil à vérifier"
            message = (
                f"{teacher_name} a {'mis à jour' if is_update else 'soumis'} son profil enseignant "
                f"et attend votre vérification."
            )
            for admin in User.objects.filter(role="admin"):
                AppNotification.objects.create(
                    user=admin,
                    title=title,
                    message=message,
                    type="system",
                    data={"teacher_id": profile.id, "teacher_user_id": profile.user.id},
                )
        except Exception:
            pass

    def _sync_avatar(self, profile):
        """Copie TeacherProfile.photo → User.avatar pour affichage unifié."""
        if profile.photo:
            user = profile.user
            user.avatar.name = profile.photo.name
            user.save(update_fields=["avatar"])

    def create(self, validated_data):
        validated_data.pop("subject_ids", None)
        validated_data.pop("level_ids", None)
        user = self.context["request"].user
        profile = TeacherProfile.objects.create(user=user, **validated_data)
        if profile.photo:
            self._sync_avatar(profile)
        self._sync_subjects(profile, self._parse_subject_levels())
        self._notify_admins(profile, is_update=False)
        return profile

    def update(self, instance, validated_data):
        validated_data.pop("subject_ids", None)
        validated_data.pop("level_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Sync photo → user.avatar si une nouvelle photo a été uploadée
        if "photo" in validated_data and instance.photo:
            self._sync_avatar(instance)

        # Suppression explicite de docs critiques (flags clear_X envoyés par le frontend)
        data = self.context["request"].data
        cleared = []
        if data.get("clear_photo"):
            instance.photo.delete(save=False)
            instance.photo = None
            cleared.append("photo de profil")
        if data.get("clear_identity_document"):
            instance.identity_document.delete(save=False)
            instance.identity_document = None
            cleared.append("pièce d'identité")
        if data.get("clear_cv"):
            instance.cv.delete(save=False)
            instance.cv = None
            cleared.append("CV")

        # Auto-dévérification si docs critiques supprimés sur un profil vérifié
        was_verified = instance.is_verified
        if cleared and was_verified:
            instance.is_verified = False

        instance.save()

        # Notifier si dévérification automatique
        if cleared and was_verified:
            try:
                from kalanconnect.chat.models import AppNotification
                docs_str = ", ".join(cleared)
                AppNotification.objects.create(
                    user=instance.user,
                    title="Badge vérifié retiré",
                    message=(
                        f"Vous avez supprimé {docs_str}, nécessaire à votre vérification. "
                        f"Votre profil repassera en révision après enregistrement. "
                        f"Veuillez fournir un nouveau document."
                    ),
                    type="system",
                    data={"teacher_id": instance.id, "cleared_docs": cleared},
                )
            except Exception:
                pass

        subject_levels = self._parse_subject_levels()
        if subject_levels:
            self._sync_subjects(instance, subject_levels)
        self._notify_admins(instance, is_update=True)
        return instance
