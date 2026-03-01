"""
KalanConnect — Views Chat (API REST pour l'historique)
Le temps réel passe par WebSocket (consumers.py)
"""

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AppNotification, Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, NotificationSerializer

User = get_user_model()


class ConversationListView(generics.ListAPIView):
    """GET /api/v1/chat/conversations/ — Mes conversations"""

    serializer_class = ConversationSerializer

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(participant_1=user) | Q(participant_2=user)
        ).select_related("participant_1", "participant_2")


class ConversationCreateView(APIView):
    """POST /api/v1/chat/conversations/start/ — Démarrer une conversation"""

    def post(self, request):
        other_user_id = request.data.get("user_id")
        if not other_user_id:
            return Response(
                {"error": "user_id requis"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur introuvable"},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        if user.id == other_user.id:
            return Response(
                {"error": "Impossible de démarrer une conversation avec vous-même"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Chercher une conversation existante
        conversation = Conversation.objects.filter(
            Q(participant_1=user, participant_2=other_user)
            | Q(participant_1=other_user, participant_2=user)
        ).first()

        if not conversation:
            conversation = Conversation.objects.create(
                participant_1=user,
                participant_2=other_user,
            )

        return Response(
            ConversationSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class MessageListView(generics.ListAPIView):
    """GET /api/v1/chat/conversations/<id>/messages/ — Messages d'une conversation"""

    serializer_class = MessageSerializer

    def get_queryset(self):
        conversation_id = self.kwargs["conversation_id"]
        user = self.request.user

        # Vérifier que l'utilisateur fait partie de la conversation
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__in=Conversation.objects.filter(
                Q(participant_1=user) | Q(participant_2=user)
            ),
        ).select_related("sender")


class MarkAsReadView(APIView):
    """POST /api/v1/chat/conversations/<id>/read/ — Marquer comme lu"""

    def post(self, request, conversation_id):
        user = request.user
        updated = Message.objects.filter(
            conversation_id=conversation_id,
            is_read=False,
        ).exclude(sender=user).update(is_read=True)
        return Response({"marked_read": updated})


class NotificationListView(generics.ListAPIView):
    """GET /api/v1/notifications/"""
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return AppNotification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    """POST /api/v1/notifications/<id>/read/"""
    def post(self, request, pk):
        try:
            notif = AppNotification.objects.get(pk=pk, user=request.user)
            notif.is_read = True
            notif.save(update_fields=["is_read"])
            return Response({"status": "read"})
        except AppNotification.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)


class NotificationMarkAllReadView(APIView):
    """POST /api/v1/notifications/read-all/"""
    def post(self, request):
        count = AppNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"marked_read": count})


class NotificationUnreadCountView(APIView):
    """GET /api/v1/notifications/unread-count/"""
    def get(self, request):
        count = AppNotification.objects.filter(user=request.user, is_read=False).count()
        return Response({"count": count})


class RegisterPushTokenView(APIView):
    """POST /api/v1/notifications/register-push/"""
    def post(self, request):
        token = request.data.get("token", "")
        if token:
            request.user.fcm_token = token
            request.user.save(update_fields=["fcm_token"])
        return Response({"status": "ok"})
