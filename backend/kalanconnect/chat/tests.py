"""
Tests — Application chat
Couvre : modèles Conversation, Message, AppNotification,
         endpoints conversations, messages, notifications, push token.
"""

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────


def make_user(phone, role="parent", first_name="Chat", last_name="User"):
    return User.objects.create_user(
        phone=phone, first_name=first_name, last_name=last_name,
        password="testpass123", role=role,
    )


def make_conversation(user1, user2):
    from kalanconnect.chat.models import Conversation
    return Conversation.objects.create(participant_1=user1, participant_2=user2)


def make_notification(user, title="Notif", msg="Message", notif_type="system"):
    from kalanconnect.chat.models import AppNotification
    return AppNotification.objects.create(
        user=user, title=title, message=msg, type=notif_type,
    )


# ─────────────────────────────────────────────────────────────
# Modèle Conversation
# ─────────────────────────────────────────────────────────────


class ConversationModelTests(TestCase):

    def setUp(self):
        self.user1 = make_user("+22390001001", "parent", "Alice", "B")
        self.user2 = make_user("+22390001002", "teacher", "Bob", "C")

    def test_create_conversation(self):
        from kalanconnect.chat.models import Conversation
        conv = Conversation.objects.create(participant_1=self.user1, participant_2=self.user2)
        self.assertIsNotNone(conv.id)
        self.assertIsNotNone(conv.created_at)

    def test_get_other_participant_from_p1(self):
        conv = make_conversation(self.user1, self.user2)
        self.assertEqual(conv.get_other_participant(self.user1), self.user2)

    def test_get_other_participant_from_p2(self):
        conv = make_conversation(self.user1, self.user2)
        self.assertEqual(conv.get_other_participant(self.user2), self.user1)

    def test_conversation_unique_together(self):
        make_conversation(self.user1, self.user2)
        with self.assertRaises(IntegrityError):
            make_conversation(self.user1, self.user2)

    def test_conversation_str(self):
        conv = make_conversation(self.user1, self.user2)
        self.assertIn("↔", str(conv))


# ─────────────────────────────────────────────────────────────
# Modèle Message
# ─────────────────────────────────────────────────────────────


class MessageModelTests(TestCase):

    def setUp(self):
        self.user1 = make_user("+22390002001", "parent", "Sender", "A")
        self.user2 = make_user("+22390002002", "teacher", "Receiver", "B")
        self.conv = make_conversation(self.user1, self.user2)

    def test_create_text_message(self):
        from kalanconnect.chat.models import Message
        msg = Message.objects.create(
            conversation=self.conv,
            sender=self.user1,
            content="Bonjour, je voudrais réserver un cours.",
            message_type="text",
        )
        self.assertEqual(msg.content, "Bonjour, je voudrais réserver un cours.")
        self.assertFalse(msg.is_read)
        self.assertEqual(msg.message_type, "text")

    def test_message_default_type_is_text(self):
        from kalanconnect.chat.models import Message
        msg = Message.objects.create(
            conversation=self.conv, sender=self.user1, content="Hello"
        )
        self.assertEqual(msg.message_type, "text")

    def test_message_is_read_default_false(self):
        from kalanconnect.chat.models import Message
        msg = Message.objects.create(
            conversation=self.conv, sender=self.user1, content="Non lu"
        )
        self.assertFalse(msg.is_read)

    def test_message_str_truncated(self):
        from kalanconnect.chat.models import Message
        msg = Message.objects.create(
            conversation=self.conv, sender=self.user1,
            content="Contenu très long " + "x" * 100,
        )
        self.assertIn(self.user1.first_name, str(msg))

    def test_messages_ordered_by_created_at(self):
        from kalanconnect.chat.models import Message
        m1 = Message.objects.create(conversation=self.conv, sender=self.user1, content="Premier")
        m2 = Message.objects.create(conversation=self.conv, sender=self.user2, content="Deuxième")
        messages = list(Message.objects.filter(conversation=self.conv))
        self.assertEqual(messages[0].id, m1.id)
        self.assertEqual(messages[1].id, m2.id)

    def test_all_message_types_valid(self):
        from kalanconnect.chat.models import Message
        types = ["text", "image", "booking", "system"]
        for i, t in enumerate(types):
            Message.objects.create(
                conversation=self.conv, sender=self.user1,
                content=f"Message {t}", message_type=t,
            )
        self.assertEqual(Message.objects.filter(conversation=self.conv).count(), len(types))


# ─────────────────────────────────────────────────────────────
# Modèle AppNotification
# ─────────────────────────────────────────────────────────────


class AppNotificationModelTests(TestCase):

    def setUp(self):
        self.user = make_user("+22390003001", "teacher", "Notif", "User")

    def test_create_notification(self):
        from kalanconnect.chat.models import AppNotification
        notif = AppNotification.objects.create(
            user=self.user,
            title="Nouvelle réservation",
            message="Un parent vient de réserver votre cours.",
            type="booking",
        )
        self.assertFalse(notif.is_read)
        self.assertEqual(notif.type, "booking")
        self.assertEqual(notif.data, {})

    def test_notification_default_type_is_system(self):
        from kalanconnect.chat.models import AppNotification
        notif = AppNotification.objects.create(
            user=self.user, title="Système", message="Msg système",
        )
        self.assertEqual(notif.type, "system")

    def test_notification_str(self):
        from kalanconnect.chat.models import AppNotification
        notif = AppNotification.objects.create(
            user=self.user, title="Test titre", message="Msg",
        )
        self.assertIn("Test titre", str(notif))

    def test_notification_with_json_data(self):
        from kalanconnect.chat.models import AppNotification
        data = {"booking_id": 42, "teacher_id": 7}
        notif = AppNotification.objects.create(
            user=self.user, title="Avec data", message="Msg", data=data,
        )
        self.assertEqual(notif.data["booking_id"], 42)

    def test_all_notification_types_valid(self):
        from kalanconnect.chat.models import AppNotification
        types = ["booking", "chat", "payment", "system", "review"]
        for t in types:
            AppNotification.objects.create(user=self.user, title=t, message="msg", type=t)
        self.assertEqual(
            AppNotification.objects.filter(user=self.user).count(), len(types)
        )


# ─────────────────────────────────────────────────────────────
# API — Conversations
# ─────────────────────────────────────────────────────────────


class ConversationAPITests(APITestCase):

    def setUp(self):
        self.user1 = make_user("+22390004001", "parent", "Conv", "Parent")
        self.user2 = make_user("+22390004002", "teacher", "Conv", "Prof")

    def test_start_conversation_creates_new(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": self.user2.id,
        }, format="json")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertIn("id", response.data)

    def test_start_conversation_is_idempotent(self):
        """Appeler deux fois retourne la même conversation."""
        self.client.force_authenticate(user=self.user1)
        r1 = self.client.post("/api/v1/chat/conversations/start/", {"user_id": self.user2.id}, format="json")
        r2 = self.client.post("/api/v1/chat/conversations/start/", {"user_id": self.user2.id}, format="json")
        self.assertIn(r1.status_code, [200, 201])
        self.assertIn(r2.status_code, [200, 201])
        self.assertEqual(r1.data["id"], r2.data["id"])

    def test_start_conversation_with_nonexistent_user(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": 999999,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_start_conversation_with_self(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": self.user1.id,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_start_conversation_without_user_id_fails(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post("/api/v1/chat/conversations/start/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_conversations_shows_own(self):
        make_conversation(self.user1, self.user2)
        self.client.force_authenticate(user=self.user1)
        response = self.client.get("/api/v1/chat/conversations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)

    def test_list_conversations_hides_others(self):
        user3 = make_user("+22390004003", "parent", "Third", "User")
        user4 = make_user("+22390004004", "parent", "Fourth", "User")
        make_conversation(user3, user4)
        self.client.force_authenticate(user=self.user1)
        response = self.client.get("/api/v1/chat/conversations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_unauthenticated_cannot_list_conversations(self):
        response = self.client.get("/api/v1/chat/conversations/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_cannot_start_conversation(self):
        response = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": self.user2.id,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Messages
# ─────────────────────────────────────────────────────────────


class MessageAPITests(APITestCase):

    def setUp(self):
        from kalanconnect.chat.models import Message
        self.user1 = make_user("+22390005001", "parent", "Msg", "Parent")
        self.user2 = make_user("+22390005002", "teacher", "Msg", "Prof")
        self.outsider = make_user("+22390005003", "parent", "Out", "Sider")
        self.conv = make_conversation(self.user1, self.user2)
        Message.objects.create(conversation=self.conv, sender=self.user1, content="Salut!")
        Message.objects.create(conversation=self.conv, sender=self.user2, content="Bonjour!")

    def test_participant_1_can_read_messages(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f"/api/v1/chat/conversations/{self.conv.id}/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 2)

    def test_participant_2_can_read_messages(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(f"/api/v1/chat/conversations/{self.conv.id}/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_outsider_gets_empty_list(self):
        """Un non-participant ne voit aucun message (queryset filtré)."""
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(f"/api/v1/chat/conversations/{self.conv.id}/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_unauthenticated_cannot_read_messages(self):
        response = self.client.get(f"/api/v1/chat/conversations/{self.conv.id}/messages/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Marquer comme lu
# ─────────────────────────────────────────────────────────────


class MarkAsReadAPITests(APITestCase):

    def setUp(self):
        from kalanconnect.chat.models import Message
        self.user1 = make_user("+22390006001", "parent", "Read", "Parent")
        self.user2 = make_user("+22390006002", "teacher", "Read", "Prof")
        self.conv = make_conversation(self.user1, self.user2)
        # L'user2 envoie 2 messages non lus à user1
        Message.objects.create(conversation=self.conv, sender=self.user2, content="Msg 1", is_read=False)
        Message.objects.create(conversation=self.conv, sender=self.user2, content="Msg 2", is_read=False)

    def test_mark_as_read_marks_received_messages(self):
        from kalanconnect.chat.models import Message
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f"/api/v1/chat/conversations/{self.conv.id}/read/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["marked_read"], 2)
        unread = Message.objects.filter(
            conversation=self.conv, is_read=False
        ).exclude(sender=self.user1).count()
        self.assertEqual(unread, 0)

    def test_mark_as_read_does_not_mark_own_messages(self):
        from kalanconnect.chat.models import Message
        Message.objects.create(conversation=self.conv, sender=self.user1, content="Mon msg", is_read=False)
        self.client.force_authenticate(user=self.user1)
        self.client.post(f"/api/v1/chat/conversations/{self.conv.id}/read/")
        # Le message envoyé par user1 ne doit pas être marqué par user1
        own_unread = Message.objects.filter(
            conversation=self.conv, sender=self.user1, is_read=False
        ).count()
        self.assertEqual(own_unread, 1)


# ─────────────────────────────────────────────────────────────
# API — Notifications
# ─────────────────────────────────────────────────────────────


class NotificationAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22390007001", "teacher", "Notif", "User")
        self.client.force_authenticate(user=self.user)

    def test_list_notifications_returns_200(self):
        make_notification(self.user, "Notif 1")
        make_notification(self.user, "Notif 2")
        response = self.client.get("/api/v1/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_notifications_only_own(self):
        other = make_user("+22390007002", "parent", "Other", "User")
        make_notification(self.user, "Ma notif")
        make_notification(other, "Pas ma notif")
        response = self.client.get("/api/v1/notifications/")
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Ma notif")

    def test_unread_count(self):
        make_notification(self.user, "N1")
        make_notification(self.user, "N2")
        response = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["unread_count"], 2)

    def test_unread_count_after_mark_read(self):
        n1 = make_notification(self.user, "N1")
        make_notification(self.user, "N2")
        self.client.post(f"/api/v1/notifications/{n1.id}/read/")
        response = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(response.data["unread_count"], 1)

    def test_mark_single_notification_read(self):
        notif = make_notification(self.user, "À lire")
        self.assertFalse(notif.is_read)
        response = self.client.post(f"/api/v1/notifications/{notif.id}/read/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_other_users_notification_returns_404(self):
        other = make_user("+22390007003", "parent", "Other", "User")
        notif = make_notification(other, "Pas la mienne")
        response = self.client.post(f"/api/v1/notifications/{notif.id}/read/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_read(self):
        from kalanconnect.chat.models import AppNotification
        make_notification(self.user, "N1")
        make_notification(self.user, "N2")
        make_notification(self.user, "N3")
        response = self.client.post("/api/v1/notifications/read-all/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["marked_read"], 3)
        unread = AppNotification.objects.filter(user=self.user, is_read=False).count()
        self.assertEqual(unread, 0)

    def test_mark_all_read_returns_count_0_when_already_read(self):
        make_notification(self.user, "Déjà lu")
        self.client.post("/api/v1/notifications/read-all/")
        response = self.client.post("/api/v1/notifications/read-all/")
        self.assertEqual(response.data["marked_read"], 0)

    def test_unauthenticated_cannot_list_notifications(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/notifications/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_cannot_get_unread_count(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Enregistrement du token push
# ─────────────────────────────────────────────────────────────


class RegisterPushTokenAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22390008001", "parent", "Push", "User")
        self.client.force_authenticate(user=self.user)

    def test_register_push_token_with_fcm_token(self):
        response = self.client.post("/api/v1/notifications/register-push/", {
            "fcm_token": "fake_fcm_token_abc123",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.fcm_token, "fake_fcm_token_abc123")

    def test_register_push_token_with_token_key(self):
        response = self.client.post("/api/v1/notifications/register-push/", {
            "token": "autre_token_xyz",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.fcm_token, "autre_token_xyz")

    def test_register_push_token_empty_body_does_not_crash(self):
        response = self.client.post("/api/v1/notifications/register-push/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_cannot_register_push_token(self):
        self.client.force_authenticate(user=None)
        response = self.client.post("/api/v1/notifications/register-push/", {
            "fcm_token": "token",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# WebSocket — Consumer JWT auth + messages temps réel
# ─────────────────────────────────────────────────────────────

from channels.db import database_sync_to_async


class WebSocketChatTests(TestCase):
    """
    Teste le consumer WebSocket avec authentification JWT.
    Vérifie : connexion, envoi/réception de messages, indicateur de frappe,
    et rejet des connexions non authentifiées.
    """

    def setUp(self):
        from kalanconnect.chat.models import Conversation
        self.user1 = make_user("+22391001001", "parent", "Alice", "WS")
        self.user2 = make_user("+22391001002", "teacher", "Bob", "WS")
        self.outsider = make_user("+22391001003", "parent", "Eve", "WS")
        self.conv = Conversation.objects.create(
            participant_1=self.user1, participant_2=self.user2
        )

    def _get_jwt(self, user):
        from rest_framework_simplejwt.tokens import AccessToken
        return str(AccessToken.for_user(user))

    def _make_url(self, token=""):
        return f"/ws/chat/{self.conv.id}/?token={token}"

    async def test_authenticated_user_can_connect(self):
        """Un participant valide peut ouvrir une connexion WebSocket."""
        from channels.testing import WebsocketCommunicator
        from config.asgi import application
        token = self._get_jwt(self.user1)
        communicator = WebsocketCommunicator(application, self._make_url(token))
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_anonymous_user_is_rejected(self):
        """Sans token -> connexion refusee."""
        from channels.testing import WebsocketCommunicator
        from config.asgi import application
        communicator = WebsocketCommunicator(application, self._make_url(""))
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_outsider_is_rejected(self):
        """Un utilisateur non participant ne peut pas se connecter."""
        from channels.testing import WebsocketCommunicator
        from config.asgi import application
        token = self._get_jwt(self.outsider)
        communicator = WebsocketCommunicator(application, self._make_url(token))
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_message_is_received_by_sender(self):
        """Le message envoye est renvoye au sender via group_send."""
        from channels.testing import WebsocketCommunicator
        from config.asgi import application
        from kalanconnect.chat.models import Message
        token = self._get_jwt(self.user1)
        communicator = WebsocketCommunicator(application, self._make_url(token))
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "text", "content": "Bonjour !"})
        response = await communicator.receive_json_from(timeout=3)
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["data"]["content"], "Bonjour !")
        self.assertEqual(response["data"]["sender_id"], self.user1.id)

        exists = await database_sync_to_async(
            Message.objects.filter(conversation=self.conv, content="Bonjour !").exists
        )()
        self.assertTrue(exists)
        await communicator.disconnect()

    async def test_message_delivered_to_other_participant(self):
        """Le message envoye par user1 est bien recu par user2."""
        from channels.testing import WebsocketCommunicator
        from config.asgi import application

        token1 = self._get_jwt(self.user1)
        token2 = self._get_jwt(self.user2)
        comm1 = WebsocketCommunicator(application, self._make_url(token1))
        comm2 = WebsocketCommunicator(application, self._make_url(token2))

        connected1, _ = await comm1.connect()
        connected2, _ = await comm2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        # comm1 recoit la notif online de user2 (user2 s'est connecte apres user1)
        online = await comm1.receive_json_from(timeout=3)
        self.assertEqual(online["type"], "online")

        await comm1.send_json_to({"type": "text", "content": "Salut user2 !"})

        # user1 recoit son propre echo
        msg1 = await comm1.receive_json_from(timeout=3)
        self.assertEqual(msg1["type"], "message")

        # user2 recoit aussi le message
        msg2 = await comm2.receive_json_from(timeout=3)
        self.assertEqual(msg2["type"], "message")
        self.assertEqual(msg2["data"]["content"], "Salut user2 !")

        await comm1.disconnect()
        await comm2.disconnect()

    async def test_typing_indicator_not_sent_to_self(self):
        """L'indicateur de frappe est envoye a l'autre participant, pas au sender."""
        from channels.testing import WebsocketCommunicator
        from config.asgi import application

        token1 = self._get_jwt(self.user1)
        token2 = self._get_jwt(self.user2)
        comm1 = WebsocketCommunicator(application, self._make_url(token1))
        comm2 = WebsocketCommunicator(application, self._make_url(token2))

        await comm1.connect()
        await comm2.connect()
        # comm1 recoit la notif online de user2
        await comm1.receive_json_from(timeout=3)

        await comm1.send_json_to({"type": "typing", "is_typing": True})

        # user2 recoit l'indicateur
        typing = await comm2.receive_json_from(timeout=3)
        self.assertEqual(typing["type"], "typing")
        self.assertTrue(typing["is_typing"])

        # user1 ne recoit rien (typing_indicator filtre le sender)
        self.assertTrue(await comm1.receive_nothing(timeout=0.5))

        await comm1.disconnect()
        await comm2.disconnect()
