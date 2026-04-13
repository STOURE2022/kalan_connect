"""
KalanConnect — Serializers Auth & User
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Child

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Inscription d'un nouvel utilisateur"""

    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "phone",
            "first_name",
            "last_name",
            "email",
            "role",
            "city",
            "neighborhood",
            "password",
            "password_confirm",
        ]

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Les mots de passe ne correspondent pas."}
            )
        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """Profil utilisateur complet"""

    has_active_subscription = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "phone",
            "first_name",
            "last_name",
            "email",
            "role",
            "avatar",
            "city",
            "neighborhood",
            "is_phone_verified",
            "has_active_subscription",
            "created_at",
        ]
        read_only_fields = ["id", "phone", "role", "is_phone_verified", "created_at"]


class UserMinimalSerializer(serializers.ModelSerializer):
    """Infos minimales (pour les listes, messages, etc.)"""

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "phone", "avatar", "role"]


class AdminUserSerializer(serializers.ModelSerializer):
    has_active_subscription = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "phone", "first_name", "last_name", "email", "role",
            "is_phone_verified", "is_active", "has_active_subscription", "created_at",
        ]


class ChildSerializer(serializers.ModelSerializer):
    level = serializers.SerializerMethodField()
    level_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Child
        fields = ["id", "first_name", "last_name", "date_of_birth", "level", "level_id", "school", "avatar", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_level(self, obj):
        if obj.level:
            from kalanconnect.teachers.serializers import LevelSerializer
            return LevelSerializer(obj.level).data
        return None

    def create(self, validated_data):
        level_id = validated_data.pop("level_id", None)
        child = Child.objects.create(**validated_data)
        if level_id:
            child.level_id = level_id
            child.save(update_fields=["level"])
        return child

    def update(self, instance, validated_data):
        level_id = validated_data.pop("level_id", None)
        if level_id is not None:
            instance.level_id = level_id
        return super().update(instance, validated_data)
