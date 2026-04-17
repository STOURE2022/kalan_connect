from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

from django.utils import timezone
from .models import ConcoursEvent, GroupSession, SessionRegistration
from .serializers import (
    ConcoursEventSerializer,
    GroupSessionCreateSerializer,
    GroupSessionDetailSerializer,
    GroupSessionListSerializer,
)


class ConcoursEventListView(generics.ListAPIView):
    """GET /api/v1/concours/ — Concours à venir (public)"""
    serializer_class   = ConcoursEventSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class   = None

    def get_queryset(self):
        return ConcoursEvent.objects.filter(
            is_active=True,
            date_examen__gte=timezone.now().date(),
        )


class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, "teacher_profile")


class IsSessionOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.teacher.user == request.user


class HasActiveSubscription(permissions.BasePermission):
    """Réservé aux utilisateurs avec un abonnement actif (parent, étudiant, student)."""
    message = "Un abonnement actif est requis pour s'inscrire à une session."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.has_active_subscription
        )


class GroupSessionListView(generics.ListAPIView):
    """GET /api/v1/sessions/ — Liste publique"""
    serializer_class = GroupSessionListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        from django.db.models import Q
        from django.utils import timezone
        import datetime

        qs = GroupSession.objects.select_related("teacher__user", "subject").prefetch_related("registrations")
        p = self.request.query_params

        # Matière
        if p.get("subject"):
            qs = qs.filter(subject__slug=p["subject"])

        # Auto-complétion défensive : sessions passées encore open/full
        import datetime as dt
        now   = timezone.now()
        today = timezone.localdate()
        stale = qs.filter(
            date__lt=today,
            status__in=[GroupSession.Status.OPEN, GroupSession.Status.FULL],
        ) | qs.filter(
            date=today,
            end_time__lt=now.time(),
            status__in=[GroupSession.Status.OPEN, GroupSession.Status.FULL],
        )
        stale_ids = list(stale.values_list("id", flat=True))
        if stale_ids:
            GroupSession.objects.filter(id__in=stale_ids).update(
                status=GroupSession.Status.COMPLETED,
                updated_at=now,
            )

        # Statut
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        else:
            # Par défaut : uniquement les sessions actives à venir
            qs = qs.exclude(status__in=["cancelled", "completed"]).filter(
                date__gte=today
            )

        # Enseignant
        if p.get("teacher"):
            qs = qs.filter(teacher_id=p["teacher"])

        # Recherche texte (titre ou nom du prof)
        if p.get("q"):
            q = p["q"]
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(teacher__user__first_name__icontains=q) |
                Q(teacher__user__last_name__icontains=q) |
                Q(description__icontains=q)
            )

        # Type de lieu
        if p.get("location_type"):
            qs = qs.filter(location_type=p["location_type"])

        # Prix
        if p.get("price") == "free":
            qs = qs.filter(price_per_student=0)
        elif p.get("price") == "paid":
            qs = qs.filter(price_per_student__gt=0)

        # Date
        if p.get("date") == "today":
            qs = qs.filter(date=today)
        elif p.get("date") == "week":
            week_end = today + datetime.timedelta(days=7)
            qs = qs.filter(date__gte=today, date__lte=week_end)
        elif p.get("date") == "upcoming":
            qs = qs.filter(date__gte=today)

        return qs


class GroupSessionCreateView(generics.CreateAPIView):
    """POST /api/v1/sessions/ — Créer (prof seulement)"""
    serializer_class = GroupSessionCreateSerializer
    permission_classes = [IsTeacher]


class GroupSessionDetailView(generics.RetrieveAPIView):
    """GET /api/v1/sessions/<id>/"""
    serializer_class = GroupSessionDetailSerializer
    permission_classes = [permissions.AllowAny]
    queryset = GroupSession.objects.select_related("teacher__user", "subject").prefetch_related("registrations__user")


class GroupSessionUpdateView(generics.UpdateAPIView):
    """PATCH /api/v1/sessions/<id>/ — Modifier (propriétaire)"""
    serializer_class = GroupSessionCreateSerializer
    permission_classes = [IsTeacher, IsSessionOwner]
    http_method_names = ["patch"]

    def get_queryset(self):
        return GroupSession.objects.filter(teacher__user=self.request.user)


class GroupSessionActionView(APIView):
    """POST /api/v1/sessions/<id>/cancel|complete/"""
    permission_classes = [IsTeacher]

    def post(self, request, pk, action):
        try:
            session = GroupSession.objects.get(pk=pk, teacher__user=request.user)
        except GroupSession.DoesNotExist:
            return Response({"error": "Session introuvable"}, status=status.HTTP_404_NOT_FOUND)

        if action == "cancel":
            if session.status in (GroupSession.Status.CANCELLED, GroupSession.Status.COMPLETED):
                return Response({"error": "Action impossible"}, status=status.HTTP_400_BAD_REQUEST)
            session.status = GroupSession.Status.CANCELLED
            # Notify registered users
            try:
                from kalanconnect.chat.models import AppNotification
                teacher_name = f"{request.user.first_name} {request.user.last_name}"
                for reg in session.registrations.filter(status="registered").select_related("user"):
                    AppNotification.objects.create(
                        user=reg.user,
                        title="Session annulée",
                        message=f"La session « {session.title} » du {session.date} avec {teacher_name} a été annulée.",
                        type="booking",
                        data={"session_id": session.id},
                    )
            except Exception:
                pass
        elif action == "complete":
            if session.status != GroupSession.Status.OPEN and session.status != GroupSession.Status.FULL:
                return Response({"error": "Action impossible"}, status=status.HTTP_400_BAD_REQUEST)
            session.status = GroupSession.Status.COMPLETED
        else:
            return Response({"error": "Action invalide"}, status=status.HTTP_400_BAD_REQUEST)

        session.save(update_fields=["status", "updated_at"])
        return Response(GroupSessionDetailSerializer(session, context={"request": request}).data)


class SessionRegisterView(APIView):
    """POST /api/v1/sessions/<id>/register/"""
    permission_classes = [HasActiveSubscription]

    def post(self, request, pk):
        try:
            session = GroupSession.objects.get(pk=pk)
        except GroupSession.DoesNotExist:
            return Response({"error": "Session introuvable"}, status=status.HTTP_404_NOT_FOUND)

        if session.status in (GroupSession.Status.CANCELLED, GroupSession.Status.COMPLETED):
            return Response({"error": "Session non disponible"}, status=status.HTTP_400_BAD_REQUEST)
        if session.status == GroupSession.Status.FULL:
            return Response({"error": "Session complète"}, status=status.HTTP_400_BAD_REQUEST)

        reg, created = SessionRegistration.objects.get_or_create(
            session=session, user=request.user,
            defaults={"status": "registered"},
        )
        if not created:
            if reg.status == "registered":
                return Response({"error": "Déjà inscrit"}, status=status.HTTP_400_BAD_REQUEST)
            reg.status = "registered"
            reg.save(update_fields=["status"])

        session.sync_status()
        session.refresh_from_db()

        # Notify teacher
        try:
            from kalanconnect.chat.models import AppNotification
            user_name = f"{request.user.first_name} {request.user.last_name}"
            AppNotification.objects.create(
                user=session.teacher.user,
                title="Nouvelle inscription",
                message=f"{user_name} s'est inscrit(e) à votre session « {session.title} ».",
                type="booking",
                data={"session_id": session.id},
            )
        except Exception:
            pass

        return Response(GroupSessionDetailSerializer(session, context={"request": request}).data)


class SessionUnregisterView(APIView):
    """POST /api/v1/sessions/<id>/unregister/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            reg = SessionRegistration.objects.get(session_id=pk, user=request.user, status="registered")
        except SessionRegistration.DoesNotExist:
            return Response({"error": "Inscription introuvable"}, status=status.HTTP_404_NOT_FOUND)

        reg.status = "cancelled"
        reg.save(update_fields=["status"])
        session = reg.session
        session.sync_status()
        session.refresh_from_db()
        return Response(GroupSessionDetailSerializer(session, context={"request": request}).data)


class TeacherSessionListView(generics.ListAPIView):
    """GET /api/v1/sessions/my/ — Sessions du prof connecté"""
    serializer_class = GroupSessionDetailSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return (
            GroupSession.objects
            .filter(teacher__user=self.request.user)
            .select_related("teacher__user", "subject")
            .prefetch_related("registrations__user")
        )


# ── Admin — ConcoursEvent CRUD ───────────────────────────────────────────────

class AdminConcoursEventSerializer(ConcoursEventSerializer):
    """Serializer admin : tous les champs en lecture/écriture."""
    class Meta(ConcoursEventSerializer.Meta):
        fields = ConcoursEventSerializer.Meta.fields + ["is_active"]


class AdminConcoursListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/admin/concours/  — Liste tous les événements (y compris inactifs)
    POST /api/v1/admin/concours/  — Crée un événement
    """
    serializer_class   = AdminConcoursEventSerializer
    permission_classes = [IsAdmin]
    pagination_class   = None

    def get_queryset(self):
        qs = ConcoursEvent.objects.all()
        if self.request.query_params.get("active") == "false":
            qs = qs.filter(is_active=False)
        elif self.request.query_params.get("active") == "true":
            qs = qs.filter(is_active=True)
        return qs


class AdminConcoursDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/admin/concours/<id>/
    PATCH  /api/v1/admin/concours/<id>/
    DELETE /api/v1/admin/concours/<id>/
    """
    serializer_class   = AdminConcoursEventSerializer
    permission_classes = [IsAdmin]
    queryset           = ConcoursEvent.objects.all()
    http_method_names  = ["get", "patch", "delete"]
