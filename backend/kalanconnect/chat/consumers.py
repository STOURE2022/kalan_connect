"""
KalanConnect — WebSocket Consumer pour le chat temps réel
"""

import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from django.db.models import Q

from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket pour le chat temps réel.

    Connexion : ws://host/ws/chat/<conversation_id>/
    """

    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
            return

        # Vérifier que l'utilisateur fait partie de la conversation
        is_participant = await self.check_participant()
        if not is_participant:
            await self.close()
            return

        # Rejoindre le groupe
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

        # Notifier la présence
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_online",
                "user_id": self.user.id,
            },
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    async def receive(self, text_data):
        """Réception d'un message du client"""
        content = json.loads(text_data)
        message_type = content.get("type", "text")

        if message_type == "text":
            message = await self.save_message(content["content"])
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": {
                        "id": message.id,
                        "sender_id": self.user.id,
                        "sender_name": f"{self.user.first_name} {self.user.last_name}",
                        "content": message.content,
                        "message_type": "text",
                        "created_at": message.created_at.isoformat(),
                    },
                },
            )

        elif message_type == "typing":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing_indicator",
                    "user_id": self.user.id,
                    "is_typing": content.get("is_typing", True),
                },
            )

        elif message_type == "read":
            await self.mark_messages_read()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "messages_read",
                    "user_id": self.user.id,
                },
            )

    # ── Handlers pour les messages de groupe ──

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "message", "data": event["message"]}))

    async def typing_indicator(self, event):
        if event["user_id"] != self.user.id:
            await self.send(text_data=json.dumps(
                {
                    "type": "typing",
                    "user_id": event["user_id"],
                    "is_typing": event["is_typing"],
                }
            ))

    async def messages_read(self, event):
        if event["user_id"] != self.user.id:
            await self.send(text_data=json.dumps(
                {"type": "read", "user_id": event["user_id"]}
            ))

    async def user_online(self, event):
        if event["user_id"] != self.user.id:
            await self.send(text_data=json.dumps(
                {"type": "online", "user_id": event["user_id"]}
            ))

    # ── Méthodes DB ──

    @database_sync_to_async
    def check_participant(self):
        return Conversation.objects.filter(
            Q(participant_1_id=self.user.id) | Q(participant_2_id=self.user.id),
            id=self.conversation_id,
        ).exists()

    @database_sync_to_async
    def save_message(self, content):
        message = Message.objects.create(
            conversation_id=self.conversation_id,
            sender=self.user,
            content=content,
        )
        self._create_chat_notification(message)
        return message

    def _create_chat_notification(self, message):
        """Crée une notification in-app pour le destinataire."""
        from .models import AppNotification
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            recipient = conversation.get_other_participant(self.user)
            sender_name = f"{self.user.first_name} {self.user.last_name}"
            preview = message.content[:80] if message.content else "Nouveau message"
            AppNotification.objects.create(
                user=recipient,
                title=f"💬 {sender_name}",
                message=preview,
                type=AppNotification.NotificationType.CHAT,
                data={
                    "conversation_id": self.conversation_id,
                    "sender_id": self.user.id,
                    "sender_name": sender_name,
                },
            )
        except Exception:
            pass

    @database_sync_to_async
    def mark_messages_read(self):
        Message.objects.filter(
            conversation_id=self.conversation_id,
            is_read=False,
        ).exclude(sender=self.user).update(is_read=True)
