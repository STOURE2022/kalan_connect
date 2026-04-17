"""
Tests — Application sessions de groupe
Couvre : inscription/désinscription, permission abonnement requis.
"""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from kalanconnect.payments.models import Subscription
from kalanconnect.sessions.models import GroupSession, SessionRegistration
from kalanconnect.teachers.models import Subject, TeacherProfile

User = get_user_model()


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def make_user(phone, role="parent"):
    return User.objects.create_user(
        phone=phone, first_name="Test", last_name="User",
        password="testpass123", role=role,
    )


def make_subscription(user, plan="monthly", sub_status="active"):
    return Subscription.objects.create(
        user=user, plan=plan, status=sub_status,
        start_date=timezone.now(),
        end_date=timezone.now() + datetime.timedelta(days=30),
    )


def make_teacher_and_session(subject):
    teacher_user = make_user("+22300000099", role="teacher")
    profile = TeacherProfile.objects.create(
        user=teacher_user,
        hourly_rate=2000,
        city="Bamako",
    )
    session = GroupSession.objects.create(
        teacher=profile,
        subject=subject,
        title="Session test",
        date=(timezone.localdate() + datetime.timedelta(days=3)),
        start_time="09:00",
        end_time="11:00",
        max_participants=5,
        price_per_student=1000,
    )
    return teacher_user, profile, session


# ─────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────

class SessionRegisterPermissionTests(APITestCase):
    """Vérifier que l'inscription à une session nécessite un abonnement actif."""

    def setUp(self):
        self.subject = Subject.objects.create(name="Maths", slug="maths", category="sciences")
        _, _, self.session = make_teacher_and_session(self.subject)
        self.url = f"/api/v1/sessions/{self.session.id}/register/"

    def test_unauthenticated_cannot_register(self):
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_without_subscription_cannot_register(self):
        user = make_user("+22300000001")
        self.client.force_authenticate(user=user)
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_with_monthly_subscription_can_register(self):
        user = make_user("+22300000002")
        make_subscription(user, plan="monthly")
        self.client.force_authenticate(user=user)
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_user_with_concours_subscription_can_register(self):
        user = make_user("+22300000003", role="etudiant")
        make_subscription(user, plan="concours")
        self.client.force_authenticate(user=user)
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_user_with_annual_subscription_can_register(self):
        user = make_user("+22300000004")
        make_subscription(user, plan="annual")
        self.client.force_authenticate(user=user)
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_user_with_expired_subscription_cannot_register(self):
        user = make_user("+22300000005")
        Subscription.objects.create(
            user=user, plan="monthly", status="expired",
            start_date=timezone.now() - datetime.timedelta(days=60),
            end_date=timezone.now() - datetime.timedelta(days=30),
        )
        self.client.force_authenticate(user=user)
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_registered_user_can_unregister_without_subscription(self):
        """La désinscription reste accessible même sans abonnement."""
        user = make_user("+22300000006")
        # Inscrire directement en DB
        SessionRegistration.objects.create(
            session=self.session, user=user, status="registered"
        )
        self.session.sync_status()
        self.client.force_authenticate(user=user)
        res = self.client.post(f"/api/v1/sessions/{self.session.id}/unregister/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
