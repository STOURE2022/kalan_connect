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

from kalanconnect.bookings.models import Booking, Report
from kalanconnect.bookings.serializers import BookingSerializer
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


class AdminVerifyTeacherView(APIView):
    """POST /api/v1/admin/teachers/<id>/verify/"""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            teacher = TeacherProfile.objects.get(pk=pk)
        except TeacherProfile.DoesNotExist:
            return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)

        approved = request.data.get("approved", False)
        teacher.is_verified = approved
        teacher.save(update_fields=["is_verified"])
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
