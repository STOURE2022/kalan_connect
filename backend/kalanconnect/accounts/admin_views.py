"""
KalanConnect — Admin API Views
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from kalanconnect.bookings.models import Booking, Report, Review
from kalanconnect.bookings.serializers import BookingSerializer, ReviewSerializer
from kalanconnect.payments.models import Payment, Subscription
from kalanconnect.teachers.models import TeacherProfile
from kalanconnect.teachers.serializers import TeacherProfileDetailSerializer

from .serializers import AdminUserSerializer, UserSerializer

User = get_user_model()


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class AdminDashboardView(APIView):
    """GET /api/v1/admin/dashboard/"""
    permission_classes = [IsAdmin]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_revenue = Payment.objects.filter(status="success").aggregate(
            total=Sum("amount")
        )["total"] or 0

        return Response({
            "total_users": User.objects.count(),
            "total_teachers": User.objects.filter(role="teacher").count(),
            "total_parents": User.objects.filter(role="parent").count(),
            "total_students": User.objects.filter(role__in=["student", "etudiant"]).count(),
            "total_bookings": Booking.objects.count(),
            "total_revenue": total_revenue,
            "pending_verifications": TeacherProfile.objects.filter(is_verified=False).count(),
            "pending_reports": Report.objects.filter(status="pending").count(),
            "active_subscriptions": Subscription.objects.filter(status="active").count(),
            "new_users_this_month": User.objects.filter(created_at__gte=month_start).count(),
            "bookings_this_month": Booking.objects.filter(created_at__gte=month_start).count(),
        })


class AdminUserListView(generics.ListAPIView):
    """GET /api/v1/admin/users/"""
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get("role")
        q = self.request.query_params.get("q")
        if role:
            qs = qs.filter(role=role)
        if q:
            qs = qs.filter(
                Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(phone__icontains=q)
            )
        return qs


class AdminUserDetailView(APIView):
    """GET /api/v1/admin/users/<id>/"""
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        data = UserSerializer(user).data
        if user.role == "teacher":
            data["bookings_count"] = Booking.objects.filter(teacher__user=user).count()
        else:
            data["bookings_count"] = Booking.objects.filter(parent=user).count()
        sub = Subscription.objects.filter(user=user, status="active").first()
        data["subscription"] = {
            "id": sub.id, "plan": sub.plan, "status": sub.status,
            "price": sub.price, "start_date": sub.start_date,
            "end_date": sub.end_date, "auto_renew": sub.auto_renew,
        } if sub else None
        return Response(data)


class AdminToggleUserActiveView(APIView):
    """POST /api/v1/admin/users/<id>/toggle-active/"""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response({"is_active": user.is_active})


class AdminPendingTeachersView(generics.ListAPIView):
    """GET /api/v1/admin/teachers/pending/"""
    serializer_class = TeacherProfileDetailSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return TeacherProfile.objects.filter(is_verified=False).select_related("user")


class AdminIncompleteTeachersView(APIView):
    """GET /api/v1/admin/teachers/incomplete/
    Professeurs inscrits mais sans TeacherProfile (étape 2 non complétée).
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        teachers = User.objects.filter(
            role="teacher",
            teacher_profile__isnull=True,
        ).order_by("-created_at")
        data = [
            {
                "id": u.id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "phone": u.phone,
                "city": u.city,
                "is_active": u.is_active,
                "created_at": u.created_at,
            }
            for u in teachers
        ]
        return Response(data)


class AdminVerifyTeacherView(APIView):
    """POST /api/v1/admin/teachers/<id>/verify/"""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            teacher = TeacherProfile.objects.get(pk=pk)
        except TeacherProfile.DoesNotExist:
            return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)

        approved = request.data.get("approved", False)
        reason = request.data.get("reason", "")
        rejected_docs = request.data.get("rejected_docs", [])  # docs présents mais invalides

        # Auto-détection des pièces manquantes
        doc_labels = {
            "photo":    "photo de profil",
            "identity": "pièce d'identité (NINA / Passeport / CNI)",
            "diploma":  "scan de diplôme",
            "cv":       "CV",
        }
        has_photo    = bool(teacher.photo)
        has_identity = bool(teacher.identity_document) and bool(teacher.identity_document_type)
        has_cv       = bool(teacher.cv)
        has_diploma  = teacher.diplomas.filter(document__gt="").exists()

        missing_docs = []
        if not has_photo:    missing_docs.append("photo")
        if not has_identity: missing_docs.append("identity")
        if not has_cv:       missing_docs.append("cv")
        if not has_diploma:  missing_docs.append("diploma")

        # Bloquer l'approbation si pièces critiques manquantes
        critical_missing = [d for d in missing_docs if d in ("photo", "identity", "cv")]
        if approved and critical_missing:
            return Response(
                {
                    "error": "Impossible d'approuver : pièces critiques manquantes.",
                    "missing_docs": critical_missing,
                    "missing_labels": [doc_labels[d] for d in critical_missing],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        teacher.is_verified = approved
        teacher.save(update_fields=["is_verified"])

        # Notifier le professeur du résultat de la vérification
        try:
            from kalanconnect.chat.models import AppNotification
            if approved:
                AppNotification.objects.create(
                    user=teacher.user,
                    title="Profil vérifié !",
                    message="Félicitations ! Votre profil a été vérifié. Vous pouvez désormais recevoir des réservations.",
                    type="system",
                    data={"teacher_id": teacher.id},
                )
            else:
                parts = []
                if missing_docs:
                    parts.append("Documents manquants : " + ", ".join(doc_labels.get(d, d) for d in missing_docs))
                # rejected_docs = docs présents mais invalides (signalés par l'admin)
                valid_rejected = [d for d in rejected_docs if d not in missing_docs]
                if valid_rejected:
                    parts.append("Documents à corriger : " + ", ".join(doc_labels.get(d, d) for d in valid_rejected))
                base_msg = ". ".join(parts) + (". " if parts else "")
                full_msg = (
                    f"Votre profil n'a pas pu être vérifié. "
                    + base_msg
                    + (f"Raison : {reason}" if reason else "Veuillez compléter votre profil et soumettre à nouveau.")
                )
                notif_title = "Documents à corriger" if (missing_docs or valid_rejected) else "Profil refusé"
                AppNotification.objects.create(
                    user=teacher.user,
                    title=notif_title,
                    message=full_msg,
                    type="system",
                    data={
                        "teacher_id": teacher.id,
                        "missing_docs": missing_docs,
                        "rejected_docs": valid_rejected,
                    },
                )
        except Exception:
            pass

        return Response(TeacherProfileDetailSerializer(teacher).data)


class AdminBookingsListView(generics.ListAPIView):
    """GET /api/v1/admin/bookings/"""
    serializer_class = BookingSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Booking.objects.all().select_related("teacher__user", "parent", "subject")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminSubscriptionsView(APIView):
    """GET /api/v1/admin/subscriptions/"""
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = Subscription.objects.select_related("user").order_by("-created_at")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        data = []
        for sub in qs:
            data.append({
                "id": sub.id,
                "plan": sub.plan,
                "status": sub.status,
                "price": sub.price,
                "start_date": sub.start_date,
                "end_date": sub.end_date,
                "auto_renew": sub.auto_renew,
                "created_at": sub.created_at,
                "user": {
                    "id": sub.user.id,
                    "first_name": sub.user.first_name,
                    "last_name": sub.user.last_name,
                    "phone": sub.user.phone,
                },
            })
        return Response(data)


class AdminReviewsView(generics.ListAPIView):
    """GET /api/v1/admin/reviews/"""
    serializer_class = ReviewSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Review.objects.select_related("parent", "teacher__user").order_by("-created_at")
        rating = self.request.query_params.get("rating")
        if rating:
            qs = qs.filter(rating=rating)
        return qs


class AdminDeleteReviewView(APIView):
    """DELETE /api/v1/admin/reviews/<id>/"""
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminRevenueView(APIView):
    """GET /api/v1/admin/revenue/"""
    permission_classes = [IsAdmin]

    def get(self, request):
        total = Payment.objects.filter(status="success").aggregate(
            total=Sum("amount")
        )["total"] or 0

        monthly = (
            Payment.objects.filter(status="success")
            .annotate(month=TruncMonth("paid_at"))
            .values("month")
            .annotate(amount=Sum("amount"))
            .order_by("month")
        )

        return Response({
            "total_revenue": total,
            "monthly_revenue": [
                {"month": str(m["month"].date()) if m["month"] else "", "amount": m["amount"] or 0}
                for m in monthly
            ],
        })
