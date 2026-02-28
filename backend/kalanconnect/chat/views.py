"""
KalanConnect — Views Chat (API REST pour l'historique)
Le temps réel passe par WebSocket (consumers.py)
"""

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

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
