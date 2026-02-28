"""
KalanConnect — Views Réservations & Avis
"""

from django.db.models import Avg
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from kalanconnect.teachers.models import TeacherProfile

from .models import Booking, Review
from .serializers import (
    BookingCreateSerializer,
    BookingSerializer,
    ReviewSerializer,
)


class IsParentWithSubscription(permissions.BasePermission):
    """Le parent doit avoir un abonnement actif pour réserver"""

    message = "Vous devez avoir un abonnement actif pour réserver un cours."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_parent
            and request.user.has_active_subscription
        )


# ──────────────────────────────────────────────
# Réservations
# ──────────────────────────────────────────────


class BookingCreateView(generics.CreateAPIView):
    """
    POST /api/v1/bookings/

    Créer une nouvelle réservation.
    Nécessite un abonnement actif.
    """

    serializer_class = BookingCreateSerializer
    permission_classes = [IsParentWithSubscription]


class BookingListView(generics.ListAPIView):
    """
    GET /api/v1/bookings/

    Mes réservations (parent ou professeur).
    """

    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_parent:
            return Booking.objects.filter(parent=user).select_related(
                "teacher__user", "subject"
            )
        elif user.is_teacher:
            return Booking.objects.filter(teacher__user=user).select_related(
                "parent", "subject"
            )
        return Booking.objects.none()


class BookingDetailView(generics.RetrieveAPIView):
    """GET /api/v1/bookings/<id>/"""

    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(
            models__in=[
                Booking.objects.filter(parent=user),
                Booking.objects.filter(teacher__user=user),
            ]
        )


@api_view(["POST"])
def booking_action(request, pk, action):
    """
    POST /api/v1/bookings/<id>/confirm/
    POST /api/v1/bookings/<id>/cancel/
    POST /api/v1/bookings/<id>/complete/

    Actions sur une réservation.
    """
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response(
            {"error": "Réservation introuvable"},
            status=status.HTTP_404_NOT_FOUND,
        )

    user = request.user
    valid_transitions = {
        "confirm": {
            "from": "pending",
            "to": "confirmed",
            "who": "teacher",
        },
        "cancel": {
            "from": ["pending", "confirmed"],
            "to": "cancelled",
            "who": "both",
        },
        "complete": {
            "from": "confirmed",
            "to": "completed",
            "who": "teacher",
        },
    }

    if action not in valid_transitions:
        return Response(
            {"error": "Action invalide"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    transition = valid_transitions[action]

    # Vérifier le statut actuel
    allowed_from = transition["from"]
    if isinstance(allowed_from, str):
        allowed_from = [allowed_from]
    if booking.status not in allowed_from:
        return Response(
            {"error": f"Action impossible depuis le statut '{booking.status}'"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Vérifier qui peut faire l'action
    is_teacher = hasattr(user, "teacher_profile") and booking.teacher == user.teacher_profile
    is_parent = booking.parent == user

    if transition["who"] == "teacher" and not is_teacher:
        return Response(
            {"error": "Seul le professeur peut effectuer cette action"},
            status=status.HTTP_403_FORBIDDEN,
        )
    if transition["who"] == "both" and not (is_teacher or is_parent):
        return Response(
            {"error": "Vous n'êtes pas autorisé"},
            status=status.HTTP_403_FORBIDDEN,
        )

    booking.status = transition["to"]
    booking.save(update_fields=["status", "updated_at"])

    # Si complété, mettre à jour les stats du professeur
    if action == "complete":
        teacher = booking.teacher
        teacher.total_bookings += 1
        teacher.save(update_fields=["total_bookings"])

    return Response(BookingSerializer(booking).data)


# ──────────────────────────────────────────────
# Avis
# ──────────────────────────────────────────────


class ReviewCreateView(generics.CreateAPIView):
    """POST /api/v1/bookings/reviews/ — Laisser un avis"""

    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        review = serializer.save(parent=self.request.user)

        # Mettre à jour avg_rating du professeur
        teacher = review.teacher
        avg = Review.objects.filter(teacher=teacher).aggregate(Avg("rating"))
        teacher.avg_rating = avg["rating__avg"] or 0
        teacher.total_reviews = Review.objects.filter(teacher=teacher).count()
        teacher.save(update_fields=["avg_rating", "total_reviews"])


class ReviewListView(generics.ListAPIView):
    """GET /api/v1/bookings/reviews/<teacher_id>/ — Avis d'un professeur"""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        teacher_id = self.kwargs["teacher_id"]
        return Review.objects.filter(teacher_id=teacher_id).select_related("parent")
