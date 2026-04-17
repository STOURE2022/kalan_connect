"""
KalanConnect — Tests de scénarios utilisateur complets
=======================================================
Couvre les 5 parcours du fichier SCENARIOS.md :
  1. Parent  (1.1 → 1.10)
  2. Élève / student  (2.1 → 2.5)
  3. Étudiant / etudiant  (3.1 → 3.9)
  4. Professeur / teacher  (4.1 → 4.10)
  5. Administrateur / admin  (5.1 → 5.7)

Lancer :
  venv/Scripts/python manage.py test kalanconnect.test_scenarios
  venv/Scripts/python manage.py test kalanconnect.test_scenarios.ParentScenarioTests
"""

import datetime

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

# ─────────────────────────────────────────────────────────────────────────────
# Image minimale valide (GIF 1×1 px) — pour les champs photo/ImageField
# ─────────────────────────────────────────────────────────────────────────────
TINY_GIF = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00"
    b"!\xf9\x04\x00\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01"
    b"\x00\x00\x02\x02D\x01\x00;"
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers partagés
# ─────────────────────────────────────────────────────────────────────────────

def make_user(phone, role="parent", first_name="Test", last_name="User",
              password="testpass123"):
    return User.objects.create_user(
        phone=phone, first_name=first_name, last_name=last_name,
        password=password, role=role,
    )


def make_subscription(user, plan="monthly"):
    from kalanconnect.payments.models import Subscription
    return Subscription.objects.create(
        user=user, plan=plan, status="active",
        start_date=timezone.now(),
        end_date=timezone.now() + datetime.timedelta(days=30),
    )


def make_subject(name="Mathématiques", slug="maths-sc", category="sciences"):
    from kalanconnect.teachers.models import Subject
    return Subject.objects.get_or_create(
        slug=slug,
        defaults={"name": name, "category": category, "is_active": True},
    )[0]


def make_level(name="Lycée", slug="lycee-sc"):
    from kalanconnect.teachers.models import Level
    return Level.objects.get_or_create(
        slug=slug, defaults={"name": name, "order": 3}
    )[0]


def make_teacher_profile(user, hourly_rate=5000):
    from kalanconnect.teachers.models import TeacherProfile
    photo = SimpleUploadedFile("photo.gif", TINY_GIF, content_type="image/gif")
    return TeacherProfile.objects.create(
        user=user, bio="Prof expérimenté.", hourly_rate=hourly_rate,
        city="Bamako", neighborhood="Hamdallaye", photo=photo,
    )


def make_booking(parent, teacher, subject, date=None, status_val="pending"):
    from kalanconnect.bookings.models import Booking
    if date is None:
        date = (timezone.now() + datetime.timedelta(days=3)).date()
    return Booking.objects.create(
        parent=parent,
        teacher=teacher,
        subject=subject,
        date=date,
        start_time=datetime.time(9, 0),
        end_time=datetime.time(10, 0),
        status=status_val,
        location_type="at_student",
        price=teacher.hourly_rate,
    )


def make_completed_booking(parent, teacher, subject):
    return make_booking(parent, teacher, subject, status_val="completed")


# ─────────────────────────────────────────────────────────────────────────────
# SCÉNARIO 1 — Parent
# ─────────────────────────────────────────────────────────────────────────────

class ParentScenarioTests(APITestCase):
    """
    Scénarios 1.1 → 1.10 : parcours complet du parent.
    """

    def setUp(self):
        # Professeur prêt à recevoir des réservations
        self.teacher_user = make_user("+22391000001", role="teacher",
                                      first_name="Moussa", last_name="Traoré")
        self.teacher_profile = make_teacher_profile(self.teacher_user)
        self.subject = make_subject()
        self.level = make_level()

    # ── 1.1 Inscription ──────────────────────────────────────────────────────

    def test_1_1_parent_registration_creates_account_and_returns_tokens(self):
        """Scénario 1.1 : le parent s'inscrit et reçoit ses tokens JWT."""
        data = {
            "phone": "+22391001001",
            "first_name": "Aminata",
            "last_name": "Diallo",
            "password": "Secure123!",
            "password_confirm": "Secure123!",
            "role": "parent",
            "city": "Bamako",
        }
        response = self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["role"], "parent")

    def test_1_1_registration_fails_without_password_confirm(self):
        """Scénario 1.1 : le champ password_confirm est obligatoire."""
        data = {
            "phone": "+22391001002",
            "first_name": "Test",
            "last_name": "User",
            "password": "Secure123!",
            "role": "parent",
        }
        response = self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_1_1_login_with_phone_returns_jwt_pair(self):
        """Scénario 1.1 : connexion par téléphone renvoie access + refresh."""
        parent = make_user("+22391001003", role="parent",
                           password="Secure123!")
        response = self.client.post("/api/v1/auth/login/", {
            "phone": "+22391001003",
            "password": "Secure123!",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    # ── 1.2 Abonnement ───────────────────────────────────────────────────────

    def test_1_2_parent_without_subscription_cannot_book(self):
        """Scénario 1.2 : sans abonnement → 403 à la réservation."""
        parent = make_user("+22391002001", role="parent")
        self.client.force_authenticate(user=parent)
        data = {
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
            "date": str((timezone.now() + datetime.timedelta(days=2)).date()),
            "start_time": "09:00",
            "end_time": "10:00",
            "location_type": "at_student",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_1_2_check_subscription_returns_status(self):
        """Scénario 1.2 : l'API retourne le statut d'abonnement du parent."""
        parent = make_user("+22391002002", role="parent")
        self.client.force_authenticate(user=parent)
        response = self.client.get("/api/v1/payments/check-subscription/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("has_subscription", response.data)
        self.assertFalse(response.data["has_subscription"])

    def test_1_2_after_subscription_check_returns_true(self):
        """Scénario 1.2 : abonnement actif → has_subscription = True."""
        parent = make_user("+22391002003", role="parent")
        make_subscription(parent)
        self.client.force_authenticate(user=parent)
        response = self.client.get("/api/v1/payments/check-subscription/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_subscription"])

    def test_1_2_subscription_plans_visible(self):
        """Scénario 1.2 : les abonnements actifs sont listés."""
        parent = make_user("+22391002004", role="parent")
        make_subscription(parent, plan="monthly")
        self.client.force_authenticate(user=parent)
        response = self.client.get("/api/v1/payments/subscriptions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ── 1.3 Recherche de professeur ──────────────────────────────────────────

    def test_1_3_search_returns_teachers(self):
        """Scénario 1.3 : la recherche globale retourne des résultats."""
        parent = make_user("+22391003001", role="parent")
        self.client.force_authenticate(user=parent)
        response = self.client.get("/api/v1/search/?q=Maths")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_1_3_search_with_filters(self):
        """Scénario 1.3 : filtres ville, tarif, en ligne, vérifié."""
        parent = make_user("+22391003002", role="parent")
        self.client.force_authenticate(user=parent)
        response = self.client.get(
            "/api/v1/teachers/search/?city=Bamako&min_rate=1000&max_rate=10000"
            "&online=false&verified=false"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_1_3_teacher_detail_visible_without_auth(self):
        """Scénario 1.3 : fiche prof accessible sans authentification."""
        response = self.client.get(f"/api/v1/teachers/{self.teacher_profile.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.teacher_profile.id)

    def test_1_3_autocomplete_returns_suggestions(self):
        """Scénario 1.3 : l'autocomplete retourne matières et profs."""
        response = self.client.get("/api/v1/teachers/autocomplete/?q=Ma")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("subjects", response.data)
        self.assertIn("teachers", response.data)

    def test_1_3_popular_subjects_returns_list(self):
        """Scénario 1.3 : les matières populaires sont retournées."""
        response = self.client.get("/api/v1/search/popular/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    # ── 1.4 Réservation (cours unique) ───────────────────────────────────────

    def test_1_4_parent_with_subscription_can_book(self):
        """Scénario 1.4 : parent abonné crée une réservation (statut pending)."""
        parent = make_user("+22391004001", role="parent")
        make_subscription(parent)
        self.client.force_authenticate(user=parent)
        data = {
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
            "date": str((timezone.now() + datetime.timedelta(days=5)).date()),
            "start_time": "09:00",
            "end_time": "10:00",
            "location_type": "at_student",
            "notes": "Mon enfant est en terminale.",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        from kalanconnect.bookings.models import Booking
        booking = Booking.objects.filter(parent=parent).latest("created_at")
        self.assertEqual(booking.status, "pending")
        self.assertEqual(booking.price, self.teacher_profile.hourly_rate)

    def test_1_4_booking_price_calculated_by_hourly_rate(self):
        """Scénario 1.4 : le prix est calculé automatiquement (tarif horaire)."""
        parent = make_user("+22391004002", role="parent")
        make_subscription(parent)
        self.client.force_authenticate(user=parent)
        data = {
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
            "date": str((timezone.now() + datetime.timedelta(days=6)).date()),
            "start_time": "14:00",
            "end_time": "16:00",  # 2h
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        from kalanconnect.bookings.models import Booking
        booking = Booking.objects.filter(parent=parent).latest("created_at")
        # 2 heures × 5000 FCFA/h = 10 000 FCFA
        self.assertEqual(booking.price, self.teacher_profile.hourly_rate * 2)

    def test_1_4_conflict_slot_rejected(self):
        """Scénario 1.4 : créneau déjà réservé → 400."""
        parent1 = make_user("+22391004003", role="parent")
        parent2 = make_user("+22391004004", role="parent")
        make_subscription(parent1)
        make_subscription(parent2)
        booking_date = str((timezone.now() + datetime.timedelta(days=7)).date())
        slot = {
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
            "date": booking_date,
            "start_time": "11:00",
            "end_time": "12:00",
            "location_type": "at_student",
        }
        self.client.force_authenticate(user=parent1)
        self.client.post("/api/v1/bookings/create/", slot, format="json")
        self.client.force_authenticate(user=parent2)
        response = self.client.post("/api/v1/bookings/create/", slot, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_1_4_pack_4_created_with_10_percent_discount(self):
        """Scénario 1.4 — Pack 4 cours avec remise -10%."""
        parent = make_user("+22391004005", role="parent")
        make_subscription(parent)
        self.client.force_authenticate(user=parent)
        data = {
            "pack_type": "pack_4",
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["discount_percent"], 10)
        self.assertEqual(response.data["total_sessions"], 4)

    def test_1_4_pack_8_created_with_15_percent_discount(self):
        """Scénario 1.4 — Pack 8 cours avec remise -15%."""
        parent = make_user("+22391004006", role="parent")
        make_subscription(parent)
        self.client.force_authenticate(user=parent)
        data = {
            "pack_type": "pack_8",
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["discount_percent"], 15)
        self.assertEqual(response.data["total_sessions"], 8)

    def test_1_4_monthly_pack_created_with_20_percent_discount(self):
        """Scénario 1.4 — Mensuel (12 cours) avec remise -20%."""
        parent = make_user("+22391004007", role="parent")
        make_subscription(parent)
        self.client.force_authenticate(user=parent)
        data = {
            "pack_type": "monthly",
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["discount_percent"], 20)
        self.assertEqual(response.data["total_sessions"], 12)

    def test_1_4_pack_total_price_correct(self):
        """Scénario 1.4 — Prix total pack 4 = tarif × 4 × 0.90."""
        parent = make_user("+22391004008", role="parent")
        make_subscription(parent)
        self.client.force_authenticate(user=parent)
        data = {
            "pack_type": "pack_4",
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        expected_total = int(5000 * 4 * 0.90)  # 18 000 FCFA
        self.assertEqual(response.data["total_price"], expected_total)

    # ── 1.5 Suivi des cours ──────────────────────────────────────────────────

    def test_1_5_parent_sees_own_bookings(self):
        """Scénario 1.5 : le parent voit ses réservations."""
        parent = make_user("+22391005001", role="parent")
        make_subscription(parent)
        make_booking(parent, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=parent)
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_1_5_parent_cannot_see_other_parents_bookings(self):
        """Scénario 1.5 : isolation des réservations entre parents."""
        parent1 = make_user("+22391005002", role="parent")
        parent2 = make_user("+22391005003", role="parent")
        make_subscription(parent1)
        make_booking(parent1, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=parent2)
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_1_5_parent_can_cancel_pending_booking(self):
        """Scénario 1.5 : le parent peut annuler un cours en attente."""
        parent = make_user("+22391005004", role="parent")
        make_subscription(parent)
        booking = make_booking(parent, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=parent)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")

    def test_1_5_parent_can_cancel_confirmed_booking(self):
        """Scénario 1.5 : le parent peut aussi annuler un cours confirmé."""
        parent = make_user("+22391005005", role="parent")
        make_subscription(parent)
        booking = make_booking(parent, self.teacher_profile, self.subject,
                               status_val="confirmed")
        self.client.force_authenticate(user=parent)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")

    # ── 1.6 Avis ────────────────────────────────────────────────────────────

    def test_1_6_parent_can_review_completed_booking(self):
        """Scénario 1.6 : avis possible uniquement sur un cours terminé."""
        parent = make_user("+22391006001", role="parent")
        make_subscription(parent)
        booking = make_completed_booking(parent, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=parent)
        data = {
            "teacher": self.teacher_profile.id,
            "booking": booking.id,
            "rating": 5,
            "comment": "Excellent professeur, très pédagogue !",
        }
        response = self.client.post("/api/v1/bookings/reviews/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_1_6_review_on_pending_booking_rejected(self):
        """Scénario 1.6 : avis refusé si le cours n'est pas terminé."""
        parent = make_user("+22391006002", role="parent")
        make_subscription(parent)
        booking = make_booking(parent, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=parent)
        data = {
            "teacher": self.teacher_profile.id,
            "booking": booking.id,
            "rating": 4,
            "comment": "Test.",
        }
        response = self.client.post("/api/v1/bookings/reviews/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_1_6_review_updates_teacher_avg_rating(self):
        """Scénario 1.6 : la note moyenne du prof est recalculée après un avis."""
        parent = make_user("+22391006003", role="parent")
        make_subscription(parent)
        booking = make_completed_booking(parent, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=parent)
        self.client.post("/api/v1/bookings/reviews/", {
            "teacher": self.teacher_profile.id,
            "booking": booking.id,
            "rating": 4,
            "comment": "Bien.",
        }, format="json")
        self.teacher_profile.refresh_from_db()
        self.assertEqual(self.teacher_profile.avg_rating, 4.0)

    def test_1_6_complete_booking_creates_review_notification(self):
        """Scénario 1.6 : terminer un cours crée une notif pour laisser un avis."""
        from kalanconnect.chat.models import AppNotification
        parent = make_user("+22391006004", role="parent")
        make_subscription(parent)
        booking = make_booking(parent, self.teacher_profile, self.subject,
                               status_val="confirmed")
        self.client.force_authenticate(user=self.teacher_user)
        self.client.post(f"/api/v1/bookings/{booking.id}/complete/")
        notif = AppNotification.objects.filter(
            user=parent, type="review"
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("avis", notif.message.lower())

    # ── 1.7 Signalement ──────────────────────────────────────────────────────

    def test_1_7_parent_can_report_teacher(self):
        """Scénario 1.7 : le parent peut signaler un professeur."""
        parent = make_user("+22391007001", role="parent")
        self.client.force_authenticate(user=parent)
        data = {
            "reported_user": self.teacher_user.id,
            "reason": "bad_behavior",
            "description": "Le professeur n'est pas venu au cours prévu.",
        }
        response = self.client.post("/api/v1/bookings/reports/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_1_7_report_starts_with_pending_status(self):
        """Scénario 1.7 : le signalement est créé avec le statut 'pending'."""
        from kalanconnect.bookings.models import Report
        parent = make_user("+22391007002", role="parent")
        self.client.force_authenticate(user=parent)
        self.client.post("/api/v1/bookings/reports/", {
            "reported_user": self.teacher_user.id,
            "reason": "bad_behavior",
            "description": "Absence injustifiée.",
        }, format="json")
        report = Report.objects.filter(reporter=parent).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.status, "pending")

    # ── 1.8 Chat ────────────────────────────────────────────────────────────

    def test_1_8_parent_can_start_conversation_with_teacher(self):
        """Scénario 1.8 : le parent ouvre une conversation avec le prof."""
        parent = make_user("+22391008001", role="parent")
        self.client.force_authenticate(user=parent)
        response = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": self.teacher_user.id,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_1_8_conversation_is_idempotent(self):
        """Scénario 1.8 : ouvrir deux fois la même conversation → même objet."""
        parent = make_user("+22391008002", role="parent")
        self.client.force_authenticate(user=parent)
        payload = {"user_id": self.teacher_user.id}
        r1 = self.client.post("/api/v1/chat/conversations/start/", payload, format="json")
        r2 = self.client.post("/api/v1/chat/conversations/start/", payload, format="json")
        self.assertEqual(r1.data["id"], r2.data["id"])

    def test_1_8_parent_can_list_conversations(self):
        """Scénario 1.8 : liste des conversations accessibles."""
        parent = make_user("+22391008003", role="parent")
        self.client.force_authenticate(user=parent)
        self.client.post("/api/v1/chat/conversations/start/",
                         {"user_id": self.teacher_user.id}, format="json")
        response = self.client.get("/api/v1/chat/conversations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_1_8_notifications_visible_to_parent(self):
        """Scénario 1.8 : les notifications de l'utilisateur sont accessibles."""
        parent = make_user("+22391008004", role="parent")
        self.client.force_authenticate(user=parent)
        response = self.client.get("/api/v1/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ── 1.9 Gestion des enfants ──────────────────────────────────────────────

    def test_1_9_parent_can_add_child(self):
        """Scénario 1.9 : le parent ajoute un enfant."""
        parent = make_user("+22391009001", role="parent")
        level = make_level()
        self.client.force_authenticate(user=parent)
        data = {
            "first_name": "Moussa",
            "last_name": "Diallo",
            "date_of_birth": "2012-03-15",
            "level_id": level.id,
            "school": "École Privée Bamako",
        }
        response = self.client.post("/api/v1/children/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["first_name"], "Moussa")

    def test_1_9_parent_can_list_own_children(self):
        """Scénario 1.9 : le parent voit uniquement ses propres enfants."""
        parent1 = make_user("+22391009002", role="parent")
        parent2 = make_user("+22391009003", role="parent")
        level = make_level()
        from kalanconnect.accounts.models import Child
        Child.objects.create(
            parent=parent1, first_name="Enfant1", last_name="P1",
            date_of_birth="2012-01-01", level=level,
        )
        Child.objects.create(
            parent=parent2, first_name="Enfant2", last_name="P2",
            date_of_birth="2013-01-01", level=level,
        )
        self.client.force_authenticate(user=parent1)
        response = self.client.get("/api/v1/children/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["first_name"], "Enfant1")

    def test_1_9_parent_can_delete_child(self):
        """Scénario 1.9 : le parent peut supprimer un enfant."""
        parent = make_user("+22391009004", role="parent")
        level = make_level()
        from kalanconnect.accounts.models import Child
        child = Child.objects.create(
            parent=parent, first_name="ASuppr", last_name="Test",
            date_of_birth="2014-06-01", level=level,
        )
        self.client.force_authenticate(user=parent)
        response = self.client.delete(f"/api/v1/children/{child.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # ── 1.10 Gestion du profil ───────────────────────────────────────────────

    def test_1_10_parent_can_update_profile(self):
        """Scénario 1.10 : le parent peut modifier ses informations."""
        parent = make_user("+22391010001", role="parent")
        self.client.force_authenticate(user=parent)
        response = self.client.patch("/api/v1/auth/profile/", {
            "first_name": "NouveauPrenom",
            "city": "Sikasso",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "NouveauPrenom")

    def test_1_10_parent_can_get_profile(self):
        """Scénario 1.10 : le parent peut consulter son profil."""
        parent = make_user("+22391010002", role="parent")
        self.client.force_authenticate(user=parent)
        response = self.client.get("/api/v1/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["phone"], "+22391010002")


# ─────────────────────────────────────────────────────────────────────────────
# SCÉNARIO 2 — Élève (student)
# ─────────────────────────────────────────────────────────────────────────────

class StudentScenarioTests(APITestCase):
    """
    Scénarios 2.1 → 2.5 : parcours de l'élève (lycéen géré via compte propre).
    """

    def setUp(self):
        self.teacher_user = make_user("+22392000001", role="teacher",
                                      first_name="Ali", last_name="Coulibaly")
        self.teacher_profile = make_teacher_profile(self.teacher_user, hourly_rate=4000)
        self.subject = make_subject("Physique", "physique-sc2", "sciences")

    # ── 2.1 Connexion ────────────────────────────────────────────────────────

    def test_2_1_student_can_register(self):
        """Scénario 2.1 : un élève peut créer son compte avec le rôle 'student'."""
        response = self.client.post("/api/v1/auth/register/", {
            "phone": "+22392001001",
            "first_name": "Ibrahima",
            "last_name": "Keïta",
            "password": "Eleve2024!",
            "password_confirm": "Eleve2024!",
            "role": "student",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], "student")

    def test_2_1_student_can_login(self):
        """Scénario 2.1 : un élève peut se connecter et obtenir ses tokens."""
        make_user("+22392001002", role="student", password="Eleve2024!")
        response = self.client.post("/api/v1/auth/login/", {
            "phone": "+22392001002",
            "password": "Eleve2024!",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    # ── 2.2 / 2.3 Emploi du temps ───────────────────────────────────────────

    def test_2_2_student_schedule_requires_auth(self):
        """Scénario 2.2 : accès à l'emploi du temps sans auth → 401."""
        response = self.client.get("/api/v1/student/schedule/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_2_3_student_sees_upcoming_bookings_in_schedule(self):
        """Scénario 2.3 : l'élève voit ses cours à venir dans l'emploi du temps."""
        student = make_user("+22392003001", role="student")
        make_subscription(student)
        booking = make_booking(student, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=student)
        response = self.client.get("/api/v1/student/schedule/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(b["id"] == booking.id for b in response.data))

    def test_2_3_schedule_shows_subject_and_teacher_info(self):
        """Scénario 2.3 : l'emploi du temps affiche matière, prof, horaire."""
        student = make_user("+22392003002", role="student")
        make_subscription(student)
        make_booking(student, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=student)
        response = self.client.get("/api/v1/student/schedule/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.data:
            entry = response.data[0]
            self.assertIn("subject_name", entry)
            self.assertIn("teacher_name", entry)
            self.assertIn("date", entry)
            self.assertIn("start_time", entry)
            self.assertIn("location_type", entry)

    # ── 2.4 Progression ─────────────────────────────────────────────────────

    def test_2_4_student_sees_progress_per_subject(self):
        """Scénario 2.4 : l'élève voit sa progression par matière."""
        student = make_user("+22392004001", role="student")
        make_completed_booking(student, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=student)
        response = self.client.get("/api/v1/student/progress/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        if response.data:
            entry = response.data[0]
            self.assertIn("subject", entry)
            self.assertIn("teacher", entry)
            self.assertIn("completed_sessions", entry)

    def test_2_4_student_progress_requires_auth(self):
        """Scénario 2.4 : l'accès à la progression sans auth → 401."""
        response = self.client.get("/api/v1/student/progress/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── 2.5 Chat ────────────────────────────────────────────────────────────

    def test_2_5_student_can_chat_with_teacher(self):
        """Scénario 2.5 : un élève peut ouvrir une conversation avec son prof."""
        student = make_user("+22392005001", role="student")
        self.client.force_authenticate(user=student)
        response = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": self.teacher_user.id,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_2_5_student_cannot_book_without_subscription(self):
        """Scénario 2.5 / matrice : un élève sans abonnement ne peut pas réserver."""
        student = make_user("+22392005002", role="student")
        self.client.force_authenticate(user=student)
        response = self.client.post("/api/v1/bookings/create/", {
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
            "date": str((timezone.now() + datetime.timedelta(days=3)).date()),
            "start_time": "09:00",
            "end_time": "10:00",
            "location_type": "at_student",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_2_5_student_sees_own_teachers(self):
        """Scénario 2.5 : l'élève voit les profs avec qui il a eu des cours."""
        student = make_user("+22392005003", role="student")
        make_completed_booking(student, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=student)
        response = self.client.get("/api/v1/student/teachers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)


# ─────────────────────────────────────────────────────────────────────────────
# SCÉNARIO 3 — Étudiant (etudiant)
# ─────────────────────────────────────────────────────────────────────────────

class EtudiantScenarioTests(APITestCase):
    """
    Scénarios 3.1 → 3.9 : parcours de l'étudiant universitaire autonome.
    """

    def setUp(self):
        self.teacher_user = make_user("+22393000001", role="teacher",
                                      first_name="Sory", last_name="Kouyaté")
        self.teacher_profile = make_teacher_profile(self.teacher_user, hourly_rate=3500)
        self.subject = make_subject("Chimie", "chimie-sc3", "sciences")

    # ── 3.1 Inscription ──────────────────────────────────────────────────────

    def test_3_1_etudiant_can_register_with_etudiant_role(self):
        """Scénario 3.1 : un étudiant s'inscrit avec le rôle 'etudiant'."""
        response = self.client.post("/api/v1/auth/register/", {
            "phone": "+22393001001",
            "first_name": "Mariam",
            "last_name": "Sanogo",
            "password": "Etudiant2024!",
            "password_confirm": "Etudiant2024!",
            "role": "etudiant",
            "city": "Bamako",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], "etudiant")

    def test_3_1_etudiant_receives_jwt_tokens_on_register(self):
        """Scénario 3.1 : l'étudiant reçoit ses tokens JWT à l'inscription."""
        response = self.client.post("/api/v1/auth/register/", {
            "phone": "+22393001002",
            "first_name": "Oumar",
            "last_name": "Bah",
            "password": "Secure2024!",
            "password_confirm": "Secure2024!",
            "role": "etudiant",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data["tokens"])

    # ── 3.2 Abonnement ───────────────────────────────────────────────────────

    def test_3_2_etudiant_can_subscribe(self):
        """Scénario 3.2 : l'étudiant peut avoir un abonnement actif."""
        etudiant = make_user("+22393002001", role="etudiant")
        make_subscription(etudiant, plan="annual")
        self.client.force_authenticate(user=etudiant)
        response = self.client.get("/api/v1/payments/check-subscription/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_subscription"])

    def test_3_2_annual_subscription_price_is_15000(self):
        """Scénario 3.2 : abonnement annuel = 15 000 FCFA."""
        from kalanconnect.payments.models import Subscription
        etudiant = make_user("+22393002002", role="etudiant")
        sub = Subscription.objects.create(
            user=etudiant, plan="annual", status="active",
            start_date=timezone.now(),
            end_date=timezone.now() + datetime.timedelta(days=365),
        )
        self.assertEqual(sub.price, 15000)

    # ── 3.3 Dashboard / Recherche ────────────────────────────────────────────

    def test_3_3_etudiant_can_search_teachers(self):
        """Scénario 3.3/3.4 : l'étudiant peut rechercher des professeurs."""
        etudiant = make_user("+22393003001", role="etudiant")
        self.client.force_authenticate(user=etudiant)
        response = self.client.get("/api/v1/teachers/search/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_3_3_etudiant_sees_schedule(self):
        """Scénario 3.3 : l'étudiant voit ses cours à venir."""
        etudiant = make_user("+22393003002", role="etudiant")
        make_subscription(etudiant)
        make_booking(etudiant, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=etudiant)
        response = self.client.get("/api/v1/student/schedule/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ── 3.5 Réservation ──────────────────────────────────────────────────────

    def test_3_5_etudiant_with_subscription_can_book(self):
        """Scénario 3.5 : l'étudiant abonné peut réserver un cours."""
        etudiant = make_user("+22393005001", role="etudiant")
        make_subscription(etudiant)
        self.client.force_authenticate(user=etudiant)
        data = {
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
            "date": str((timezone.now() + datetime.timedelta(days=4)).date()),
            "start_time": "10:00",
            "end_time": "11:00",
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_3_5_etudiant_can_buy_pack(self):
        """Scénario 3.5 : l'étudiant peut acheter un pack de cours."""
        etudiant = make_user("+22393005002", role="etudiant")
        make_subscription(etudiant)
        self.client.force_authenticate(user=etudiant)
        response = self.client.post("/api/v1/bookings/packs/create/", {
            "pack_type": "pack_4",
            "teacher": self.teacher_profile.id,
            "subject": self.subject.id,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_3_5_etudiant_sees_own_bookings(self):
        """Scénario 3.5 : l'étudiant voit ses propres réservations."""
        etudiant = make_user("+22393005003", role="etudiant")
        make_subscription(etudiant)
        make_booking(etudiant, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=etudiant)
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    # ── 3.6 Avis ────────────────────────────────────────────────────────────

    def test_3_6_etudiant_can_review_completed_booking(self):
        """Scénario 3.6 : l'étudiant peut laisser un avis sur un cours terminé."""
        etudiant = make_user("+22393006001", role="etudiant")
        make_subscription(etudiant)
        booking = make_completed_booking(etudiant, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=etudiant)
        response = self.client.post("/api/v1/bookings/reviews/", {
            "teacher": self.teacher_profile.id,
            "booking": booking.id,
            "rating": 5,
            "comment": "Très bon professeur de chimie !",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # ── 3.7 Signalement ──────────────────────────────────────────────────────

    def test_3_7_etudiant_can_report_teacher(self):
        """Scénario 3.7 : l'étudiant peut signaler un professeur."""
        etudiant = make_user("+22393007001", role="etudiant")
        self.client.force_authenticate(user=etudiant)
        response = self.client.post("/api/v1/bookings/reports/", {
            "reported_user": self.teacher_user.id,
            "reason": "bad_behavior",
            "description": "Le professeur était irrespectueux.",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # ── 3.8 Chat ────────────────────────────────────────────────────────────

    def test_3_8_etudiant_can_chat_with_teacher(self):
        """Scénario 3.8 : l'étudiant peut échanger des messages avec un prof."""
        etudiant = make_user("+22393008001", role="etudiant")
        self.client.force_authenticate(user=etudiant)
        response = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": self.teacher_user.id,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_3_8_etudiant_can_cancel_booking(self):
        """Scénario 3.8 / matrice : l'étudiant peut annuler son cours."""
        etudiant = make_user("+22393008002", role="etudiant")
        make_subscription(etudiant)
        booking = make_booking(etudiant, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=etudiant)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")


# ─────────────────────────────────────────────────────────────────────────────
# SCÉNARIO 4 — Professeur (teacher)
# ─────────────────────────────────────────────────────────────────────────────

class TeacherScenarioTests(APITestCase):
    """
    Scénarios 4.1 → 4.10 : parcours complet du professeur.
    """

    def setUp(self):
        self.teacher_user = make_user("+22394000001", role="teacher",
                                      first_name="Bakary", last_name="Diarra")
        self.subject = make_subject("Français", "francais-sc4", "lettres")
        self.level = make_level("Terminale", "terminale-sc4")
        # Un parent pour les réservations
        self.parent = make_user("+22394000002", role="parent")
        make_subscription(self.parent)

    # ── 4.1 Inscription ──────────────────────────────────────────────────────

    def test_4_1_teacher_can_register(self):
        """Scénario 4.1 : un professeur peut s'inscrire."""
        response = self.client.post("/api/v1/auth/register/", {
            "phone": "+22394001001",
            "first_name": "Sékou",
            "last_name": "Koné",
            "password": "Teacher2024!",
            "password_confirm": "Teacher2024!",
            "role": "teacher",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], "teacher")

    # ── 4.2 Compléter le profil ──────────────────────────────────────────────

    def test_4_2_teacher_can_create_profile(self):
        """Scénario 4.2 : le prof crée son profil avec photo, bio, tarif."""
        self.client.force_authenticate(user=self.teacher_user)
        photo = SimpleUploadedFile("photo.gif", TINY_GIF, content_type="image/gif")
        data = {
            "bio": "Professeur de français avec 10 ans d'expérience.",
            "hourly_rate": 6000,
            "city": "Bamako",
            "neighborhood": "Kalaban Coura",
            "experience_years": 10,
            "teaches_online": True,
            "teaches_at_home": True,
            "photo": photo,
        }
        response = self.client.post("/api/v1/teachers/profile/", data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_4_2_non_teacher_cannot_create_teacher_profile(self):
        """Scénario 4.2 : un parent ne peut pas créer un profil professeur."""
        self.client.force_authenticate(user=self.parent)
        photo = SimpleUploadedFile("photo.gif", TINY_GIF, content_type="image/gif")
        response = self.client.post("/api/v1/teachers/profile/", {
            "bio": "Bio.",
            "hourly_rate": 5000,
            "city": "Bamako",
            "photo": photo,
        }, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_4_2_teacher_can_add_diploma(self):
        """Scénario 4.2 : le prof ajoute un diplôme à son profil."""
        profile = make_teacher_profile(self.teacher_user)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post("/api/v1/teachers/diplomas/", {
            "title": "Master en Lettres Modernes",
            "institution": "Université de Bamako",
            "year": 2015,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_4_2_teacher_can_access_my_profile(self):
        """Scénario 4.2 : le prof peut consulter son propre profil."""
        make_teacher_profile(self.teacher_user)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get("/api/v1/teachers/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_4_2_parent_cannot_access_my_teacher_profile(self):
        """Scénario 4.2 : un parent ne peut pas accéder à /teachers/me/."""
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/teachers/me/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── 4.3 Vérification par l'admin ─────────────────────────────────────────

    def test_4_3_teacher_is_unverified_by_default(self):
        """Scénario 4.3 : le profil prof est non vérifié à la création."""
        profile = make_teacher_profile(self.teacher_user)
        self.assertFalse(profile.is_verified)

    def test_4_3_teacher_receives_notification_when_verified(self):
        """Scénario 4.3 : le prof reçoit une notification quand son profil est vérifié."""
        from kalanconnect.chat.models import AppNotification
        profile = make_teacher_profile(self.teacher_user)
        admin = make_user("+22394003001", role="admin")
        self.client.force_authenticate(user=admin)
        self.client.post(f"/api/v1/admin/teachers/{profile.id}/verify/", {
            "approved": True,
        }, format="json")
        notif = AppNotification.objects.filter(
            user=self.teacher_user, title__icontains="vérifié"
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("vérifié", notif.title.lower())

    def test_4_3_teacher_receives_notification_when_rejected(self):
        """Scénario 4.3 : le prof est notifié si son profil est refusé (avec raison)."""
        from kalanconnect.chat.models import AppNotification
        profile = make_teacher_profile(self.teacher_user)
        admin = make_user("+22394003002", role="admin")
        self.client.force_authenticate(user=admin)
        self.client.post(f"/api/v1/admin/teachers/{profile.id}/verify/", {
            "approved": False,
            "reason": "Diplômes insuffisants",
        }, format="json")
        notif = AppNotification.objects.filter(
            user=self.teacher_user, title__icontains="refus"
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("Diplômes insuffisants", notif.message)

    # ── 4.4 Disponibilités ───────────────────────────────────────────────────

    def test_4_4_teacher_can_add_availability(self):
        """Scénario 4.4 : le prof ajoute un créneau de disponibilité."""
        make_teacher_profile(self.teacher_user)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post("/api/v1/teachers/availability/", {
            "day_of_week": 1,  # Lundi
            "start_time": "08:00",
            "end_time": "12:00",
            "is_recurring": True,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_4_4_teacher_can_list_availabilities(self):
        """Scénario 4.4 : le prof voit ses créneaux de disponibilité."""
        profile = make_teacher_profile(self.teacher_user)
        from kalanconnect.teachers.models import Availability
        Availability.objects.create(
            teacher=profile, day_of_week=2,
            start_time=datetime.time(14, 0), end_time=datetime.time(18, 0),
        )
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get("/api/v1/teachers/availability/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_4_4_non_teacher_cannot_add_availability(self):
        """Scénario 4.4 : un non-teacher ne peut pas ajouter de disponibilité."""
        self.client.force_authenticate(user=self.parent)
        response = self.client.post("/api/v1/teachers/availability/", {
            "day_of_week": 1, "start_time": "08:00", "end_time": "12:00",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── 4.5 Accepter / Refuser des cours ─────────────────────────────────────

    def test_4_5_teacher_can_confirm_pending_booking(self):
        """Scénario 4.5 : le prof confirme une réservation en attente."""
        profile = make_teacher_profile(self.teacher_user)
        booking = make_booking(self.parent, profile, self.subject)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")

    def test_4_5_confirm_notifies_parent(self):
        """Scénario 4.5 : la confirmation crée une notification pour le parent."""
        from kalanconnect.chat.models import AppNotification
        profile = make_teacher_profile(self.teacher_user)
        booking = make_booking(self.parent, profile, self.subject)
        self.client.force_authenticate(user=self.teacher_user)
        self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        notif = AppNotification.objects.filter(
            user=self.parent, type="booking"
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("confirmé", notif.message.lower())

    def test_4_5_parent_cannot_confirm_booking(self):
        """Scénario 4.5 : le parent ne peut pas confirmer (seul le prof peut)."""
        profile = make_teacher_profile(self.teacher_user)
        booking = make_booking(self.parent, profile, self.subject)
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_4_5_teacher_cancel_notifies_parent(self):
        """Scénario 4.5 : si le prof annule, le parent est notifié."""
        from kalanconnect.chat.models import AppNotification
        profile = make_teacher_profile(self.teacher_user)
        booking = make_booking(self.parent, profile, self.subject)
        self.client.force_authenticate(user=self.teacher_user)
        self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        notif = AppNotification.objects.filter(
            user=self.parent, type="booking", title__icontains="annulé"
        ).first()
        self.assertIsNotNone(notif)

    def test_4_5_cancel_by_parent_notifies_teacher(self):
        """Scénario 4.5 : si le parent annule, le prof est notifié."""
        from kalanconnect.chat.models import AppNotification
        profile = make_teacher_profile(self.teacher_user)
        booking = make_booking(self.parent, profile, self.subject)
        self.client.force_authenticate(user=self.parent)
        self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        notif = AppNotification.objects.filter(
            user=self.teacher_user, type="booking", title__icontains="annulé"
        ).first()
        self.assertIsNotNone(notif)

    def test_4_5_cannot_confirm_already_confirmed_booking(self):
        """Scénario 4.5 : on ne peut pas confirmer deux fois → 400."""
        profile = make_teacher_profile(self.teacher_user)
        booking = make_booking(self.parent, profile, self.subject,
                               status_val="confirmed")
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ── 4.6 Compléter un cours ───────────────────────────────────────────────

    def test_4_6_teacher_can_complete_confirmed_booking(self):
        """Scénario 4.6 : le prof marque un cours confirmé comme terminé."""
        profile = make_teacher_profile(self.teacher_user)
        booking = make_booking(self.parent, profile, self.subject,
                               status_val="confirmed")
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/complete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "completed")

    def test_4_6_complete_updates_teacher_total_bookings(self):
        """Scénario 4.6 : la statistique total_bookings du prof est incrémentée."""
        profile = make_teacher_profile(self.teacher_user)
        initial_count = profile.total_bookings
        booking = make_booking(self.parent, profile, self.subject,
                               status_val="confirmed")
        self.client.force_authenticate(user=self.teacher_user)
        self.client.post(f"/api/v1/bookings/{booking.id}/complete/")
        profile.refresh_from_db()
        self.assertEqual(profile.total_bookings, initial_count + 1)

    def test_4_6_complete_sends_review_notification_to_parent(self):
        """Scénario 4.6 : terminer envoie une notif pour laisser un avis."""
        from kalanconnect.chat.models import AppNotification
        profile = make_teacher_profile(self.teacher_user)
        booking = make_booking(self.parent, profile, self.subject,
                               status_val="confirmed")
        self.client.force_authenticate(user=self.teacher_user)
        self.client.post(f"/api/v1/bookings/{booking.id}/complete/")
        notif = AppNotification.objects.filter(
            user=self.parent, type="review"
        ).first()
        self.assertIsNotNone(notif)

    # ── 4.7 Statistiques revenus ─────────────────────────────────────────────

    def test_4_7_teacher_can_view_stats(self):
        """Scénario 4.7 : le prof voit ses statistiques (revenus, cours, élèves)."""
        make_teacher_profile(self.teacher_user)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get("/api/v1/teachers/me/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_bookings", response.data)
        self.assertIn("total_earnings", response.data)
        self.assertIn("avg_rating", response.data)

    def test_4_7_parent_cannot_view_teacher_stats(self):
        """Scénario 4.7 : un parent ne peut pas accéder aux stats du prof."""
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/teachers/me/stats/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── 4.8 Voir ses élèves ──────────────────────────────────────────────────

    def test_4_8_teacher_can_view_students_list(self):
        """Scénario 4.8 : le prof voit la liste de ses élèves."""
        profile = make_teacher_profile(self.teacher_user)
        make_booking(self.parent, profile, self.subject)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get("/api/v1/teachers/me/students/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)

    def test_4_8_parent_cannot_view_teacher_students(self):
        """Scénario 4.8 : un parent ne peut pas accéder aux élèves du prof."""
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/teachers/me/students/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── 4.9 Chat ────────────────────────────────────────────────────────────

    def test_4_9_teacher_can_chat_with_parent(self):
        """Scénario 4.9 : le prof peut ouvrir une conversation avec un parent."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": self.parent.id,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_4_9_teacher_sees_conversations(self):
        """Scénario 4.9 : le prof voit ses conversations."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get("/api/v1/chat/conversations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ── 4.10 Mise à jour profil ──────────────────────────────────────────────

    def test_4_10_teacher_can_update_profile(self):
        """Scénario 4.10 : le prof peut modifier sa bio et son tarif."""
        make_teacher_profile(self.teacher_user)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.patch("/api/v1/teachers/me/", {
            "bio": "Bio mise à jour.",
            "hourly_rate": 7000,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# SCÉNARIO 5 — Administrateur (admin)
# ─────────────────────────────────────────────────────────────────────────────

class AdminScenarioTests(APITestCase):
    """
    Scénarios 5.1 → 5.7 : parcours complet de l'administrateur.
    """

    def setUp(self):
        self.admin = make_user("+22395000001", role="admin",
                               first_name="Admin", last_name="KalanConnect")
        self.teacher_user = make_user("+22395000002", role="teacher",
                                      first_name="Fatoumata", last_name="Sidibé")
        self.teacher_profile = make_teacher_profile(self.teacher_user)
        self.parent = make_user("+22395000003", role="parent")
        make_subscription(self.parent)
        self.subject = make_subject("Biologie", "bio-sc5", "sciences")

    # ── 5.1 Dashboard ────────────────────────────────────────────────────────

    def test_5_1_admin_can_access_dashboard(self):
        """Scénario 5.1 : l'admin accède au tableau de bord."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_5_1_dashboard_contains_all_stats(self):
        """Scénario 5.1 : le dashboard retourne toutes les statistiques."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_keys = [
            "total_users", "total_teachers", "total_parents", "total_students",
            "total_bookings", "total_revenue", "pending_verifications",
            "pending_reports", "active_subscriptions",
            "new_users_this_month", "bookings_this_month",
        ]
        for key in expected_keys:
            self.assertIn(key, response.data, f"Clé manquante : {key}")

    def test_5_1_dashboard_counts_students_and_etudiant(self):
        """Scénario 5.1 : le dashboard compte les élèves ET les étudiants."""
        make_user("+22395001001", role="student")
        make_user("+22395001002", role="etudiant")
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/dashboard/")
        self.assertGreaterEqual(response.data["total_students"], 2)

    def test_5_1_non_admin_cannot_access_dashboard(self):
        """Scénario 5.1 : un parent ne peut pas accéder au dashboard admin."""
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── 5.2 Gestion des utilisateurs ─────────────────────────────────────────

    def test_5_2_admin_can_list_all_users(self):
        """Scénario 5.2 : l'admin liste tous les utilisateurs."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_5_2_admin_can_filter_users_by_role(self):
        """Scénario 5.2 : filtrer les utilisateurs par rôle."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/users/?role=teacher")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        for user_data in results:
            self.assertEqual(user_data["role"], "teacher")

    def test_5_2_admin_can_search_user_by_name(self):
        """Scénario 5.2 : rechercher un utilisateur par nom."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/users/?q=Fatoumata")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_5_2_admin_can_view_user_detail(self):
        """Scénario 5.2 : l'admin voit le détail d'un utilisateur."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"/api/v1/admin/users/{self.parent.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("bookings_count", response.data)
        self.assertIn("subscription", response.data)

    def test_5_2_admin_user_detail_shows_teacher_bookings(self):
        """Scénario 5.2 : le détail d'un prof montre le nombre de cours reçus."""
        make_booking(self.parent, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"/api/v1/admin/users/{self.teacher_user.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["bookings_count"], 1)

    def test_5_2_admin_can_deactivate_user(self):
        """Scénario 5.2 : l'admin peut désactiver un compte utilisateur."""
        target = make_user("+22395002001", role="parent")
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/v1/admin/users/{target.id}/toggle-active/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        target.refresh_from_db()
        self.assertFalse(target.is_active)

    def test_5_2_admin_can_reactivate_user(self):
        """Scénario 5.2 : l'admin peut réactiver un compte désactivé."""
        target = make_user("+22395002002", role="parent")
        target.is_active = False
        target.save()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/v1/admin/users/{target.id}/toggle-active/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        target.refresh_from_db()
        self.assertTrue(target.is_active)

    # ── 5.3 Vérification des professeurs ─────────────────────────────────────

    def test_5_3_admin_sees_pending_teachers(self):
        """Scénario 5.3 : l'admin voit les profs en attente de vérification."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/teachers/pending/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        ids = [t["id"] for t in results]
        self.assertIn(self.teacher_profile.id, ids)

    def test_5_3_admin_can_approve_teacher(self):
        """Scénario 5.3 : l'admin approuve un professeur → is_verified = True."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/v1/admin/teachers/{self.teacher_profile.id}/verify/",
            {"approved": True}, format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher_profile.refresh_from_db()
        self.assertTrue(self.teacher_profile.is_verified)

    def test_5_3_approved_teacher_not_in_pending_list(self):
        """Scénario 5.3 : un prof approuvé disparaît de la liste 'pending'."""
        self.teacher_profile.is_verified = True
        self.teacher_profile.save()
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/teachers/pending/")
        results = response.data.get("results", response.data)
        ids = [t["id"] for t in results]
        self.assertNotIn(self.teacher_profile.id, ids)

    def test_5_3_admin_can_reject_teacher(self):
        """Scénario 5.3 : l'admin refuse un professeur → is_verified = False."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/v1/admin/teachers/{self.teacher_profile.id}/verify/",
            {"approved": False, "reason": "Documents insuffisants"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher_profile.refresh_from_db()
        self.assertFalse(self.teacher_profile.is_verified)

    def test_5_3_approval_notification_received_by_teacher(self):
        """Scénario 5.3 : la notification est envoyée au prof après vérification."""
        from kalanconnect.chat.models import AppNotification
        self.client.force_authenticate(user=self.admin)
        self.client.post(
            f"/api/v1/admin/teachers/{self.teacher_profile.id}/verify/",
            {"approved": True}, format="json",
        )
        notif = AppNotification.objects.filter(user=self.teacher_user).first()
        self.assertIsNotNone(notif)

    # ── 5.4 Gestion des signalements ─────────────────────────────────────────

    def test_5_4_admin_can_list_reports(self):
        """Scénario 5.4 : l'admin voit tous les signalements."""
        from kalanconnect.bookings.models import Report
        Report.objects.create(
            reporter=self.parent,
            reported_user=self.teacher_user,
            reason="bad_behavior",
            description="Test.",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/reports/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_5_4_admin_can_filter_reports_by_status(self):
        """Scénario 5.4 : filtrer les signalements par statut."""
        from kalanconnect.bookings.models import Report
        Report.objects.create(
            reporter=self.parent, reported_user=self.teacher_user,
            reason="bad_behavior", description="Test.",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/reports/?status=pending")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        for r in results:
            self.assertEqual(r["status"], "pending")

    def test_5_4_admin_can_mark_report_as_reviewed(self):
        """Scénario 5.4 : l'admin marque un signalement comme 'examiné'."""
        from kalanconnect.bookings.models import Report
        report = Report.objects.create(
            reporter=self.parent, reported_user=self.teacher_user,
            reason="bad_behavior", description="Test.",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/v1/admin/reports/{report.id}/",
            {"status": "reviewed", "admin_notes": "En cours d'examen."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.status, "reviewed")

    def test_5_4_admin_can_resolve_report(self):
        """Scénario 5.4 : l'admin résout un signalement."""
        from kalanconnect.bookings.models import Report
        report = Report.objects.create(
            reporter=self.parent, reported_user=self.teacher_user,
            reason="bad_behavior", description="Test.",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/v1/admin/reports/{report.id}/",
            {"status": "resolved", "admin_notes": "Professeur averti."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.status, "resolved")

    def test_5_4_admin_can_dismiss_report(self):
        """Scénario 5.4 : l'admin rejette un signalement non fondé."""
        from kalanconnect.bookings.models import Report
        report = Report.objects.create(
            reporter=self.parent, reported_user=self.teacher_user,
            reason="bad_behavior", description="Test.",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/v1/admin/reports/{report.id}/",
            {"status": "dismissed"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.status, "dismissed")

    def test_5_4_non_admin_cannot_list_reports(self):
        """Scénario 5.4 : un parent ne peut pas voir les signalements admin."""
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/admin/reports/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── 5.5 Alertes automatiques ─────────────────────────────────────────────

    def test_5_5_low_rating_triggers_admin_notification(self):
        """Scénario 5.5 : note < 2.5 avec ≥3 avis → notification admin créée."""
        from kalanconnect.chat.models import AppNotification
        from kalanconnect.bookings.models import Booking, Review
        admin2 = make_user("+22395005001", role="admin")

        # Créer 3 réservations terminées pour avoir 3 avis
        for i, rating in enumerate([1, 2, 1], start=1):
            reviewer = make_user(f"+2239500500{i+1}", role="parent")
            make_subscription(reviewer)
            booking = Booking.objects.create(
                parent=reviewer,
                teacher=self.teacher_profile,
                subject=self.subject,
                date=(timezone.now() + datetime.timedelta(days=i)).date(),
                start_time=datetime.time(9, 0),
                end_time=datetime.time(10, 0),
                status="completed",
                price=self.teacher_profile.hourly_rate,
            )
            self.client.force_authenticate(user=reviewer)
            self.client.post("/api/v1/bookings/reviews/", {
                "teacher": self.teacher_profile.id,
                "booking": booking.id,
                "rating": rating,
                "comment": "Mauvais cours.",
            }, format="json")

        # Vérifier qu'une notification admin a été créée
        notif = AppNotification.objects.filter(
            type="system", title__icontains="alerte"
        ).first()
        self.assertIsNotNone(notif)
        self.assertIn("/5", notif.message)  # le message contient la note moyenne formatée

    # ── 5.6 Revenus ─────────────────────────────────────────────────────────

    def test_5_6_admin_can_view_revenue(self):
        """Scénario 5.6 : l'admin consulte les revenus totaux et mensuels."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/revenue/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_revenue", response.data)
        self.assertIn("monthly_revenue", response.data)
        self.assertIsInstance(response.data["monthly_revenue"], list)

    def test_5_6_non_admin_cannot_view_revenue(self):
        """Scénario 5.6 : un non-admin ne peut pas accéder aux revenus."""
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/admin/revenue/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── 5.7 Gestion des réservations ─────────────────────────────────────────

    def test_5_7_admin_can_list_all_bookings(self):
        """Scénario 5.7 : l'admin voit toutes les réservations."""
        make_booking(self.parent, self.teacher_profile, self.subject)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_5_7_admin_can_filter_bookings_by_status(self):
        """Scénario 5.7 : filtrer les réservations par statut."""
        make_booking(self.parent, self.teacher_profile, self.subject,
                     status_val="confirmed")
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/bookings/?status=confirmed")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        for b in results:
            self.assertEqual(b["status"], "confirmed")

    def test_5_7_non_admin_cannot_list_all_bookings(self):
        """Scénario 5.7 : un parent ne peut pas voir toutes les réservations admin."""
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/admin/bookings/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
