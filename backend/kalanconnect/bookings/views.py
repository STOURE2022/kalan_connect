"""
KalanConnect — Views Réservations, Avis, Packs & Signalements
"""

from django.db.models import Avg
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from kalanconnect.teachers.models import TeacherProfile

from .models import Booking, BookingPack, Report, Review
from .serializers import (
    BookingCreateSerializer,
    BookingPackCreateSerializer,
    BookingPackSerializer,
    BookingSerializer,
    ReportAdminSerializer,
    ReportSerializer,
    ReviewSerializer,
)


class IsParentOrEtudiantWithSubscription(permissions.BasePermission):
    """Le parent ou l'étudiant doit avoir un abonnement actif pour réserver"""

    message = "Vous devez avoir un abonnement actif pour réserver un cours."

    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated
            and (user.is_parent or user.is_etudiant)
            and user.has_active_subscription
        )


class IsAdmin(permissions.BasePermission):
    """Seul un admin peut accéder"""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


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
    permission_classes = [IsParentOrEtudiantWithSubscription]


class BookingListView(generics.ListAPIView):
    """
    GET /api/v1/bookings/

    Mes réservations (parent, étudiant ou professeur).
    """

    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_parent or user.is_etudiant:
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
        if user.is_parent or user.is_etudiant:
            return Booking.objects.filter(parent=user)
        elif user.is_teacher:
            return Booking.objects.filter(teacher__user=user)
        return Booking.objects.none()


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
    is_booker = booking.parent == user  # parent ou étudiant

    if transition["who"] == "teacher" and not is_teacher:
        return Response(
            {"error": "Seul le professeur peut effectuer cette action"},
            status=status.HTTP_403_FORBIDDEN,
        )
    if transition["who"] == "both" and not (is_teacher or is_booker):
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

        # Alerte automatique si la moyenne tombe sous 2.5
        if teacher.avg_rating < 2.5 and teacher.total_reviews >= 3:
            from kalanconnect.accounts.models import User

            admins = User.objects.filter(role="admin")
            for admin in admins:
                # Créer une notification pour chaque admin
                try:
                    from kalanconnect.chat.models import AppNotification

                    AppNotification.objects.create(
                        user=admin,
                        title="Alerte qualité professeur",
                        message=(
                            f"{teacher.user.first_name} {teacher.user.last_name} "
                            f"a une note moyenne de {teacher.avg_rating:.1f}/5 "
                            f"({teacher.total_reviews} avis). Vérification recommandée."
                        ),
                        type="system",
                        data={"teacher_id": teacher.id},
                    )
                except Exception:
                    pass  # Ne pas bloquer si le modèle notification n'existe pas


class ReviewListView(generics.ListAPIView):
    """GET /api/v1/bookings/reviews/<teacher_id>/ — Avis d'un professeur"""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        teacher_id = self.kwargs["teacher_id"]
        return Review.objects.filter(teacher_id=teacher_id).select_related("parent")


# ──────────────────────────────────────────────
# Packs de cours
# ──────────────────────────────────────────────


class BookingPackCreateView(generics.CreateAPIView):
    """POST /api/v1/bookings/packs/ — Créer un pack de cours"""

    serializer_class = BookingPackCreateSerializer
    permission_classes = [IsParentOrEtudiantWithSubscription]

    def perform_create(self, serializer):
        serializer.save()


class BookingPackListView(generics.ListAPIView):
    """GET /api/v1/bookings/packs/ — Mes packs actifs"""

    serializer_class = BookingPackSerializer

    def get_queryset(self):
        return BookingPack.objects.filter(
            buyer=self.request.user,
            status="active",
        ).select_related("teacher__user", "subject")


# ──────────────────────────────────────────────
# Signalements
# ──────────────────────────────────────────────


class ReportCreateView(generics.CreateAPIView):
    """POST /api/v1/bookings/reports/ — Signaler un utilisateur"""

    serializer_class = ReportSerializer

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class ReportAdminListView(generics.ListAPIView):
    """GET /api/v1/admin/reports/ — Liste des signalements (admin)"""

    serializer_class = ReportAdminSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Report.objects.all().select_related("reporter", "reported_user")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class ReportAdminUpdateView(generics.UpdateAPIView):
    """PATCH /api/v1/admin/reports/<id>/ — Traiter un signalement (admin)"""

    serializer_class = ReportAdminSerializer
    permission_classes = [IsAdmin]
    queryset = Report.objects.all()
