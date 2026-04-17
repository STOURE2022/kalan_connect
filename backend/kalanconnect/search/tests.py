"""
Tests — Application search
Couvre : recherche globale et matières populaires.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────


def make_subject(name, slug, category="sciences"):
    from kalanconnect.teachers.models import Subject
    return Subject.objects.create(name=name, slug=slug, category=category, is_active=True)


def make_teacher_with_profile(phone, city="Bamako"):
    from kalanconnect.teachers.models import TeacherProfile
    user = User.objects.create_user(
        phone=phone, first_name="Search", last_name="Prof",
        password="testpass123", role="teacher",
    )
    return TeacherProfile.objects.create(
        user=user, bio="Bio.", hourly_rate=4000, city=city, neighborhood="Centre",
    )


# ─────────────────────────────────────────────────────────────
# API — Recherche globale
# ─────────────────────────────────────────────────────────────


class GlobalSearchAPITests(APITestCase):

    def setUp(self):
        make_subject("Mathématiques", "maths-search", "sciences")
        make_subject("Français", "francais-search", "lettres")
        make_subject("Anglais", "anglais-search", "langues")
        make_teacher_with_profile("+22396001001", city="Bamako")
        make_teacher_with_profile("+22396001002", city="Sikasso")

    def test_search_returns_200(self):
        response = self.client.get("/api/v1/search/?q=Maths")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_no_query_returns_200(self):
        response = self.client.get("/api/v1/search/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_with_city_filter(self):
        response = self.client.get("/api/v1/search/?q=Maths&city=Bamako")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_unknown_subject_returns_empty_or_200(self):
        response = self.client.get("/api/v1/search/?q=XYZ_INEXISTANT_999")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_is_public_no_auth_required(self):
        """La recherche ne nécessite pas d'authentification."""
        response = self.client.get("/api/v1/search/?q=Français")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_by_partial_name(self):
        response = self.client.get("/api/v1/search/?q=Math")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_response_is_list_or_dict(self):
        response = self.client.get("/api/v1/search/?q=Anglais")
        self.assertIn(response.status_code, [status.HTTP_200_OK])
        self.assertIn(type(response.data), [list, dict])


# ─────────────────────────────────────────────────────────────
# API — Matières populaires
# ─────────────────────────────────────────────────────────────


class PopularSubjectsAPITests(APITestCase):

    def setUp(self):
        from kalanconnect.teachers.models import TeacherSubject, Level
        self.level = Level.objects.create(name="Pop Level", slug="pop-level", order=5)
        self.subj1 = make_subject("Maths Populaire", "maths-pop")
        self.subj2 = make_subject("Physique Pop", "physique-pop", "sciences")
        self.subj3 = make_subject("Anglais Pop", "anglais-pop", "langues")

        p1 = make_teacher_with_profile("+22396002001", city="Bamako")
        p2 = make_teacher_with_profile("+22396002002", city="Bamako")
        p3 = make_teacher_with_profile("+22396002003", city="Sikasso")

        TeacherSubject.objects.create(teacher=p1, subject=self.subj1, level=self.level)
        TeacherSubject.objects.create(teacher=p2, subject=self.subj1, level=self.level)
        TeacherSubject.objects.create(teacher=p3, subject=self.subj2, level=self.level)

    def test_popular_subjects_returns_200(self):
        response = self.client.get("/api/v1/search/popular/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_popular_subjects_returns_list(self):
        response = self.client.get("/api/v1/search/popular/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_popular_subjects_max_8(self):
        """L'endpoint retourne au plus 8 matières."""
        response = self.client.get("/api/v1/search/popular/")
        self.assertLessEqual(len(response.data), 8)

    def test_popular_subjects_by_city(self):
        response = self.client.get("/api/v1/search/popular/?city=Bamako")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_popular_subjects_is_public(self):
        response = self.client.get("/api/v1/search/popular/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_popular_subjects_unknown_city_returns_empty_or_200(self):
        response = self.client.get("/api/v1/search/popular/?city=VilleInexistante999")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
