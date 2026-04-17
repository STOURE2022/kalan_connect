"""
KalanConnect — Serializers Chat
"""

from rest_framework import serializers

from kalanconnect.accounts.serializers import UserMinimalSerializer

from .models import AppNotification, Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender = UserMinimalSerializer(read_only=True)
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "content",
            "message_type",
            "attachment",
            "attachment_url",
            "attachment_name",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "is_read", "created_at"]

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.attachment.url)
        return obj.attachment.url

    def get_attachment_name(self, obj):
        if not obj.attachment:
            return None
        return obj.attachment.name.split("/")[-1]


class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    free_messages_used = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "other_participant",
            "last_message",
            "unread_count",
            "last_message_at",
            "free_messages_used",
        ]

    def get_other_participant(self, obj):
        user = self.context["request"].user
        other = obj.get_other_participant(user)
        return UserMinimalSerializer(other).data

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if msg:
            preview = msg.content
            if not preview:
                if msg.message_type == "image":
                    preview = "📷 Photo"
                elif msg.message_type == "file":
                    preview = "📎 Fichier"
            return {
                "content": preview,
                "sender_id": msg.sender_id,
                "created_at": msg.created_at,
                "is_read": msg.is_read,
            }
        return None

    def get_unread_count(self, obj):
        user = self.context["request"].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_free_messages_used(self, obj):
        """Nombre de messages envoyés par cet utilisateur dans cette conversation."""
        user = self.context["request"].user
        return obj.messages.filter(sender=user).count()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppNotification
        fields = ["id", "title", "message", "type", "is_read", "data", "created_at"]
        read_only_fields = ["id", "title", "message", "type", "data", "created_at"]
