"""
KalanConnect — Modèles Chat temps réel
"""

from django.conf import settings
from django.db import models


class Conversation(models.Model):
    """Conversation entre deux utilisateurs"""

    participant_1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_as_p1",
    )
    participant_2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_as_p2",
    )
    last_message_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "conversations"
        ordering = ["-last_message_at"]
        unique_together = ["participant_1", "participant_2"]

    def __str__(self):
        return f"Conversation {self.participant_1} ↔ {self.participant_2}"

    def get_other_participant(self, user):
        if self.participant_1 == user:
            return self.participant_2
        return self.participant_1


class Message(models.Model):
    """Message dans une conversation"""

    class MessageType(models.TextChoices):
        TEXT = "text", "Texte"
        IMAGE = "image", "Image"
        BOOKING = "booking", "Réservation"
        SYSTEM = "system", "Système"

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messages_sent",
    )
    content = models.TextField()
    message_type = models.CharField(
        max_length=10,
        choices=MessageType.choices,
        default=MessageType.TEXT,
    )
    attachment = models.FileField(upload_to="chat/attachments/", blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender}: {self.content[:50]}"


class AppNotification(models.Model):
    """Notification in-app"""

    class NotificationType(models.TextChoices):
        BOOKING = "booking", "Réservation"
        CHAT = "chat", "Message"
        PAYMENT = "payment", "Paiement"
        SYSTEM = "system", "Système"
        REVIEW = "review", "Avis"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(
        max_length=10,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    is_read = models.BooleanField(default=False)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user}: {self.title}"
