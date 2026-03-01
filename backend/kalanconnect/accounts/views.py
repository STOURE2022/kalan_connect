"""
KalanConnect — Views Auth & User
"""

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Child
from .serializers import ChildSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — Inscription"""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/profile/ — Mon profil"""

    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user


class VerifyPhoneView(APIView):
    """POST /api/v1/auth/verify-phone/ — Vérification OTP"""

    def post(self, request):
        otp_code = request.data.get("otp")
        # TODO: Vérifier le code OTP (stocké en Redis)
        # Pour le MVP, on valide directement
        request.user.is_phone_verified = True
        request.user.save(update_fields=["is_phone_verified"])
        return Response({"status": "verified"})


class ChildListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/children/"""
    serializer_class = ChildSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Child.objects.filter(parent=self.request.user).select_related("level")

    def perform_create(self, serializer):
        serializer.save(parent=self.request.user)


class ChildDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/v1/children/<id>/"""
    serializer_class = ChildSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Child.objects.filter(parent=self.request.user)


class ChildProgressView(APIView):
    """GET /api/v1/children/<id>/progress/"""
    def get(self, request, pk):
        from kalanconnect.bookings.models import Booking, Review
        from django.db.models import Avg, Count

        try:
            child = Child.objects.get(pk=pk, parent=request.user)
        except Child.DoesNotExist:
            return Response({"error": "Enfant introuvable"}, status=status.HTTP_404_NOT_FOUND)

        # Get bookings made by parent for subjects matching child's needs
        bookings = Booking.objects.filter(parent=request.user, status="completed")

        # Group by subject and teacher
        progress_data = []
        subjects = bookings.values("subject", "teacher").distinct()
        for entry in subjects:
            subject_bookings = bookings.filter(subject=entry["subject"], teacher=entry["teacher"])
            total = subject_bookings.count()
            teacher_profile = subject_bookings.first().teacher
            subject_obj = subject_bookings.first().subject

            avg_rating = Review.objects.filter(
                teacher=teacher_profile, parent=request.user
            ).aggregate(Avg("rating"))["rating__avg"] or 0

            last_session = subject_bookings.order_by("-date").first()

            progress_data.append({
                "subject": {"id": subject_obj.id, "name": subject_obj.name, "slug": subject_obj.slug, "icon": subject_obj.icon, "category": subject_obj.category} if subject_obj else None,
                "teacher": {"id": teacher_profile.user.id, "first_name": teacher_profile.user.first_name, "last_name": teacher_profile.user.last_name, "avatar": None},
                "total_sessions": total,
                "completed_sessions": total,
                "avg_rating": round(avg_rating, 1),
                "last_session_date": str(last_session.date) if last_session else None,
            })

        return Response(progress_data)


class StudentScheduleView(APIView):
    """GET /api/v1/student/schedule/"""
    def get(self, request):
        from kalanconnect.bookings.models import Booking
        bookings = Booking.objects.filter(
            parent=request.user,
            status__in=["pending", "confirmed"],
        ).select_related("teacher__user", "subject").order_by("date", "start_time")

        data = [{
            "id": b.id,
            "subject_name": b.subject.name if b.subject else "",
            "teacher_name": f"{b.teacher.user.first_name} {b.teacher.user.last_name}",
            "date": str(b.date),
            "start_time": str(b.start_time),
            "end_time": str(b.end_time),
            "location_type": b.location_type,
            "status": b.status,
        } for b in bookings]
        return Response(data)


class StudentProgressView(APIView):
    """GET /api/v1/student/progress/"""
    def get(self, request):
        from kalanconnect.bookings.models import Booking, Review
        from django.db.models import Avg

        completed = Booking.objects.filter(parent=request.user, status="completed")
        subjects = completed.values("subject", "teacher").distinct()

        progress = []
        for entry in subjects:
            sub_bookings = completed.filter(subject=entry["subject"], teacher=entry["teacher"])
            total = sub_bookings.count()
            teacher_profile = sub_bookings.first().teacher
            subject_obj = sub_bookings.first().subject
            avg = Review.objects.filter(teacher=teacher_profile, parent=request.user).aggregate(Avg("rating"))["rating__avg"] or 0
            last = sub_bookings.order_by("-date").first()

            progress.append({
                "subject": {"id": subject_obj.id, "name": subject_obj.name, "slug": subject_obj.slug, "icon": subject_obj.icon, "category": subject_obj.category} if subject_obj else None,
                "teacher": {"id": teacher_profile.user.id, "first_name": teacher_profile.user.first_name, "last_name": teacher_profile.user.last_name, "avatar": None},
                "total_sessions": total,
                "completed_sessions": total,
                "avg_rating": round(avg, 1),
                "last_session_date": str(last.date) if last else None,
            })
        return Response(progress)


class StudentTeachersView(APIView):
    """GET /api/v1/student/teachers/"""
    def get(self, request):
        from kalanconnect.bookings.models import Booking
        from kalanconnect.teachers.serializers import TeacherProfileListSerializer
        from kalanconnect.teachers.models import TeacherProfile

        teacher_ids = Booking.objects.filter(
            parent=request.user
        ).values_list("teacher_id", flat=True).distinct()

        teachers = TeacherProfile.objects.filter(id__in=teacher_ids).select_related("user")

        return Response({
            "count": teachers.count(),
            "results": TeacherProfileListSerializer(teachers, many=True).data,
        })


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/"""
    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        if not old_password or not new_password:
            return Response({"error": "old_password et new_password requis"}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(old_password):
            return Response({"error": "Ancien mot de passe incorrect"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        return Response({"detail": "Mot de passe modifie"})


class DeleteAccountView(APIView):
    """DELETE /api/v1/auth/account/"""
    def delete(self, request):
        request.user.is_active = False
        request.user.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)
