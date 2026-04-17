from rest_framework import serializers
from django.utils import timezone
from kalanconnect.accounts.serializers import UserMinimalSerializer
from .models import ConcoursEvent, GroupSession, SessionRegistration


class ConcoursEventSerializer(serializers.ModelSerializer):
    days_until_inscription = serializers.SerializerMethodField()
    days_until_examen      = serializers.SerializerMethodField()
    type_display           = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model  = ConcoursEvent
        fields = [
            "id", "type", "type_display", "title", "year",
            "date_inscription_limite", "date_examen",
            "description", "days_until_inscription", "days_until_examen",
        ]

    def get_days_until_inscription(self, obj):
        if not obj.date_inscription_limite:
            return None
        delta = (obj.date_inscription_limite - timezone.now().date()).days
        return max(0, delta)

    def get_days_until_examen(self, obj):
        delta = (obj.date_examen - timezone.now().date()).days
        return max(0, delta)


class TeacherMiniSerializer(serializers.Serializer):
    id         = serializers.IntegerField(source="user.id")
    first_name = serializers.CharField(source="user.first_name")
    last_name  = serializers.CharField(source="user.last_name")
    photo      = serializers.ImageField()
    avg_rating = serializers.FloatField()
    teacher_id = serializers.IntegerField(source="id")


class SubjectMiniSerializer(serializers.Serializer):
    id   = serializers.IntegerField()
    name = serializers.CharField()


class GroupSessionListSerializer(serializers.ModelSerializer):
    teacher           = TeacherMiniSerializer(read_only=True)
    subject           = SubjectMiniSerializer(read_only=True)
    participants_count = serializers.IntegerField(read_only=True)
    spots_left        = serializers.SerializerMethodField()

    class Meta:
        model = GroupSession
        fields = [
            "id", "teacher", "subject", "title",
            "date", "start_time", "end_time",
            "location_type", "price_per_student",
            "max_participants", "participants_count", "spots_left",
            "status",
        ]

    def get_spots_left(self, obj):
        return max(0, obj.max_participants - obj.participants_count)


class GroupSessionDetailSerializer(GroupSessionListSerializer):
    is_registered = serializers.SerializerMethodField()
    registrations = serializers.SerializerMethodField()

    class Meta(GroupSessionListSerializer.Meta):
        fields = GroupSessionListSerializer.Meta.fields + [
            "description", "address", "is_registered", "registrations", "created_at",
        ]

    def get_is_registered(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.registrations.filter(user=request.user, status="registered").exists()

    def get_registrations(self, obj):
        request = self.context.get("request")
        # Only teacher sees the list of participants
        if not request:
            return []
        try:
            is_owner = obj.teacher.user == request.user
        except Exception:
            is_owner = False
        if not is_owner:
            return []
        regs = obj.registrations.filter(status="registered").select_related("user")
        return [
            {
                "id": r.id,
                "user": {
                    "id": r.user.id,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name,
                    "phone": getattr(r.user, "phone", ""),
                },
                "created_at": r.created_at,
            }
            for r in regs
        ]


class GroupSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupSession
        fields = [
            "subject", "title", "description",
            "date", "start_time", "end_time",
            "location_type", "address",
            "max_participants", "price_per_student",
        ]

    def validate(self, data):
        if data["start_time"] >= data["end_time"]:
            raise serializers.ValidationError("L'heure de fin doit être après l'heure de début.")
        return data

    def create(self, validated_data):
        teacher = self.context["request"].user.teacher_profile
        return GroupSession.objects.create(teacher=teacher, **validated_data)
