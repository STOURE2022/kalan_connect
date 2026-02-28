"""
KalanConnect — Recherche globale
"""

from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from kalanconnect.teachers.models import Subject, TeacherProfile, TeacherSubject
from kalanconnect.teachers.serializers import SubjectSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def global_search(request):
    """
    GET /api/v1/search/?q=maths&city=Bamako

    Recherche globale rapide pour la page d'accueil.
    Retourne matières correspondantes + nombre de professeurs.
    """
    q = request.query_params.get("q", "").strip()
    city = request.query_params.get("city", "Bamako")

    results = {
        "subjects": [],
        "teacher_count": 0,
    }

    if len(q) >= 2:
        subjects = Subject.objects.filter(
            name__icontains=q,
            is_active=True,
        )
        results["subjects"] = SubjectSerializer(subjects, many=True).data

        results["teacher_count"] = TeacherProfile.objects.filter(
            city__iexact=city,
            user__is_active=True,
            teacher_subjects__subject__in=subjects,
        ).distinct().count()

    return Response(results)


@api_view(["GET"])
@permission_classes([AllowAny])
def popular_subjects(request):
    """
    GET /api/v1/search/popular/?city=Bamako

    Matières les plus populaires (par nombre de professeurs).
    Pour la page d'accueil.
    """
    city = request.query_params.get("city", "Bamako")

    subjects = (
        Subject.objects.filter(
            is_active=True,
            teachers__city__iexact=city,
            teachers__user__is_active=True,
        )
        .annotate(teacher_count=Count("teachers", distinct=True))
        .order_by("-teacher_count")[:8]
    )

    data = []
    for subject in subjects:
        data.append(
            {
                **SubjectSerializer(subject).data,
                "teacher_count": subject.teacher_count,
            }
        )

    return Response(data)
