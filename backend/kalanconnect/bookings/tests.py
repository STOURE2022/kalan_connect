"""
Tests — Application bookings
Couvre : modèles Booking, Review, BookingPack, Report,
         création/liste/détail réservations, machine à états,
         avis, packs, signalements, accès admin.
"""

import datetime

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────


def make_user(phone, role="parent", first_name="Test", last_name="User"):
    return User.objects.create_user(
        phone=phone, first_name=first_name, last_name=last_name,
        password="testpass123", role=role,
    )


def make_active_subscription(user):
    from kalanconnect.payments.models import Subscription
    return Subscription.objects.create(
        user=user, plan="monthly", status="active",
        start_date=timezone.now(),
        end_date=timezone.now() + datetime.timedelta(days=30),
    )


def make_teacher_profile(user, hourly_rate=5000):
    from kalanconnect.teachers.models import TeacherProfile
    return TeacherProfile.objects.create(
        user=user, bio="Bio test.", hourly_rate=hourly_rate,
        city="Bamako", neighborhood="ACI",
    )


def make_subject(name="Matière Test", slug=None):
    from kalanconnect.teachers.models import Subject
    slug = slug or name.lower().replace(" ", "-")
    return Subject.objects.create(name=name, slug=slug)


def make_booking(teacher, parent, subject, date=None, start="10:00", end="11:00",
                 price=5000, status_val="pending"):
    from kalanconnect.bookings.models import Booking
    return Booking.objects.create(
        teacher=teacher, parent=parent, subject=subject,
        date=date or datetime.date(2026, 7, 1),
        start_time=datetime.time(*[int(x) for x in start.split(":")]),
        end_time=datetime.time(*[int(x) for x in end.split(":")]),
        price=price, status=status_val,
    )


# ─────────────────────────────────────────────────────────────
# Modèle Booking
# ─────────────────────────────────────────────────────────────


class BookingModelTests(TestCase):

    def setUp(self):
        self.parent = make_user("+22380001001", "parent")
        self.teacher_user = make_user("+22380001002", "teacher", "Prof", "A")
        self.teacher = make_teacher_profile(self.teacher_user)
        self.subject = make_subject("Booking Subj", "booking-subj")

    def test_create_booking_default_status_pending(self):
        from kalanconnect.bookings.models import Booking
        b = make_booking(self.teacher, self.parent, self.subject)
        self.assertEqual(b.status, Booking.Status.PENDING)

    def test_create_booking_default_location_at_student(self):
        from kalanconnect.bookings.models import Booking
        b = make_booking(self.teacher, self.parent, self.subject)
        self.assertEqual(b.location_type, Booking.LocationType.AT_STUDENT)

    def test_booking_str_contains_reservation(self):
        b = make_booking(self.teacher, self.parent, self.subject)
        self.assertIn("Réservation", str(b))

    def test_booking_price_is_stored(self):
        b = make_booking(self.teacher, self.parent, self.subject, price=7500)
        self.assertEqual(b.price, 7500)


# ─────────────────────────────────────────────────────────────
# Modèle Review
# ─────────────────────────────────────────────────────────────


class ReviewModelTests(TestCase):

    def setUp(self):
        self.parent = make_user("+22380002001", "parent")
        self.teacher_user = make_user("+22380002002", "teacher")
        self.teacher = make_teacher_profile(self.teacher_user)
        self.subject = make_subject("Review Subj", "review-subj")
        self.booking = make_booking(
            self.teacher, self.parent, self.subject,
            date=datetime.date(2026, 5, 10), status_val="completed",
        )

    def test_create_review_success(self):
        from kalanconnect.bookings.models import Review
        r = Review.objects.create(
            teacher=self.teacher, parent=self.parent,
            booking=self.booking, rating=5, comment="Excellent!",
        )
        self.assertEqual(r.rating, 5)
        self.assertIn("5/5", str(r))

    def test_review_unique_per_booking(self):
        from kalanconnect.bookings.models import Review
        Review.objects.create(
            teacher=self.teacher, parent=self.parent, booking=self.booking, rating=4,
        )
        with self.assertRaises(IntegrityError):
            Review.objects.create(
                teacher=self.teacher, parent=self.parent, booking=self.booking, rating=3,
            )


# ─────────────────────────────────────────────────────────────
# Modèle BookingPack
# ─────────────────────────────────────────────────────────────


class BookingPackModelTests(TestCase):

    def setUp(self):
        self.parent = make_user("+22380003001", "parent")
        self.teacher_user = make_user("+22380003002", "teacher")
        self.teacher = make_teacher_profile(self.teacher_user, hourly_rate=5000)
        self.subject = make_subject("Pack Subj", "pack-subj")

    def _make_pack(self, pack_type="pack_4", total=4, used=0, expires_at=None):
        from kalanconnect.bookings.models import BookingPack
        return BookingPack.objects.create(
            pack_type=pack_type, buyer=self.parent, teacher=self.teacher,
            subject=self.subject, total_sessions=total, used_sessions=used,
            price_per_session=5000, total_price=18000, discount_percent=10,
            expires_at=expires_at,
        )

    def test_remaining_sessions_calculated_correctly(self):
        pack = self._make_pack(total=4, used=1)
        self.assertEqual(pack.remaining_sessions, 3)

    def test_use_session_increments_counter(self):
        pack = self._make_pack(total=4, used=0)
        pack.use_session()
        pack.refresh_from_db()
        self.assertEqual(pack.used_sessions, 1)
        self.assertEqual(pack.status, "active")

    def test_use_last_session_sets_exhausted(self):
        pack = self._make_pack(total=4, used=3)
        pack.use_session()
        pack.refresh_from_db()
        self.assertEqual(pack.used_sessions, 4)
        self.assertEqual(pack.status, "exhausted")

    def test_check_expired_past_date(self):
        pack = self._make_pack(expires_at=timezone.now() - datetime.timedelta(days=1))
        result = pack.check_expired()
        self.assertTrue(result)
        pack.refresh_from_db()
        self.assertEqual(pack.status, "expired")

    def test_check_not_expired_future_date(self):
        pack = self._make_pack(expires_at=timezone.now() + datetime.timedelta(days=30))
        result = pack.check_expired()
        self.assertFalse(result)
        pack.refresh_from_db()
        self.assertEqual(pack.status, "active")

    def test_check_expired_no_date_returns_false(self):
        pack = self._make_pack()  # pas d'expires_at
        result = pack.check_expired()
        self.assertFalse(result)

    def test_pack_str_representation(self):
        pack = self._make_pack()
        self.assertIn("0/4", str(pack))


# ─────────────────────────────────────────────────────────────
# Modèle Report
# ─────────────────────────────────────────────────────────────


class ReportModelTests(TestCase):

    def setUp(self):
        self.reporter = make_user("+22380004001", "parent")
        self.reported = make_user("+22380004002", "teacher")

    def test_create_report_default_status_pending(self):
        from kalanconnect.bookings.models import Report
        r = Report.objects.create(
            reporter=self.reporter, reported_user=self.reported,
            reason="bad_behavior", description="Comportement inacceptable.",
        )
        self.assertEqual(r.status, "pending")
        self.assertIn("Signalement", str(r))

    def test_report_all_reasons_valid(self):
        from kalanconnect.bookings.models import Report
        reasons = ["bad_behavior", "no_show", "inappropriate", "fraud", "low_quality", "other"]
        for i, reason in enumerate(reasons):
            Report.objects.create(
                reporter=self.reporter, reported_user=self.reported,
                reason=reason, description=f"Description {i}.",
            )
        self.assertEqual(Report.objects.filter(reporter=self.reporter).count(), len(reasons))


# ─────────────────────────────────────────────────────────────
# API — Création de réservation
# ─────────────────────────────────────────────────────────────


class BookingCreateAPITests(APITestCase):

    def setUp(self):
        self.parent = make_user("+22380005001", "parent", "Bakary", "Parent")
        make_active_subscription(self.parent)
        self.teacher_user = make_user("+22380005002", "teacher", "Moussa", "Prof")
        self.teacher = make_teacher_profile(self.teacher_user, hourly_rate=5000)
        self.subject = make_subject("Physique API", "physique-api")

    def test_parent_with_subscription_can_book(self):
        from kalanconnect.bookings.models import Booking
        self.client.force_authenticate(user=self.parent)
        data = {
            "teacher": self.teacher.id,
            "subject": self.subject.id,
            "date": "2026-08-01",
            "start_time": "10:00:00",
            "end_time": "11:00:00",
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Vérifier en base que la réservation a bien le statut pending
        booking = Booking.objects.filter(parent=self.parent).latest("created_at")
        self.assertEqual(booking.status, "pending")

    def test_price_calculated_from_duration(self):
        """2 heures × 5000 FCFA/h = 10 000 FCFA"""
        from kalanconnect.bookings.models import Booking
        self.client.force_authenticate(user=self.parent)
        data = {
            "teacher": self.teacher.id,
            "subject": self.subject.id,
            "date": "2026-08-02",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Vérifier en base
        booking = Booking.objects.filter(parent=self.parent).latest("created_at")
        self.assertEqual(booking.price, 10000)

    def test_parent_without_subscription_gets_403(self):
        parent_no_sub = make_user("+22380005003", "parent", "NoSub", "Parent")
        self.client.force_authenticate(user=parent_no_sub)
        data = {
            "teacher": self.teacher.id,
            "subject": self.subject.id,
            "date": "2026-08-03",
            "start_time": "10:00:00",
            "end_time": "11:00:00",
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_gets_401_or_403(self):
        data = {
            "teacher": self.teacher.id,
            "subject": self.subject.id,
            "date": "2026-08-04",
            "start_time": "10:00:00",
            "end_time": "11:00:00",
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_end_before_start_fails(self):
        self.client.force_authenticate(user=self.parent)
        data = {
            "teacher": self.teacher.id,
            "subject": self.subject.id,
            "date": "2026-08-05",
            "start_time": "11:00:00",
            "end_time": "10:00:00",  # Avant le début
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_overlapping_slot_conflict_detected(self):
        """Un créneau qui chevauche une réservation existante doit être refusé."""
        make_booking(
            self.teacher, self.parent, self.subject,
            date=datetime.date(2026, 8, 6),
            start="10:00", end="11:00", status_val="pending",
        )
        self.client.force_authenticate(user=self.parent)
        data = {
            "teacher": self.teacher.id,
            "subject": self.subject.id,
            "date": "2026-08-06",
            "start_time": "10:30:00",  # Chevauchement
            "end_time": "11:30:00",
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_cannot_create_booking(self):
        """Un professeur ne peut pas réserver lui-même."""
        self.client.force_authenticate(user=self.teacher_user)
        data = {
            "teacher": self.teacher.id,
            "subject": self.subject.id,
            "date": "2026-08-07",
            "start_time": "10:00:00",
            "end_time": "11:00:00",
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_etudiant_with_subscription_can_book(self):
        etudiant = make_user("+22380005004", "etudiant", "Étudiant", "Test")
        make_active_subscription(etudiant)
        self.client.force_authenticate(user=etudiant)
        data = {
            "teacher": self.teacher.id,
            "subject": self.subject.id,
            "date": "2026-08-08",
            "start_time": "14:00:00",
            "end_time": "15:00:00",
            "location_type": "online",
        }
        response = self.client.post("/api/v1/bookings/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────
# API — Liste et détail des réservations
# ─────────────────────────────────────────────────────────────


class BookingListDetailAPITests(APITestCase):

    def setUp(self):
        self.parent = make_user("+22380006001", "parent", "List", "Parent")
        self.other_parent = make_user("+22380006002", "parent", "Other", "Parent")
        self.teacher_user = make_user("+22380006003", "teacher", "List", "Prof")
        self.teacher = make_teacher_profile(self.teacher_user)
        self.subject = make_subject("List Subj", "list-subj")
        self.booking = make_booking(self.teacher, self.parent, self.subject)

    def test_parent_sees_own_bookings(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)

    def test_teacher_sees_received_bookings(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)

    def test_other_parent_sees_empty_list(self):
        self.client.force_authenticate(user=self.other_parent)
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_parent_can_get_own_booking_detail(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.get(f"/api/v1/bookings/{self.booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.booking.id)

    def test_other_parent_cannot_get_booking_detail(self):
        self.client.force_authenticate(user=self.other_parent)
        response = self.client.get(f"/api/v1/bookings/{self.booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_cannot_list_bookings(self):
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Machine à états (confirm / cancel / complete)
# ─────────────────────────────────────────────────────────────


class BookingActionAPITests(APITestCase):

    def setUp(self):
        self.parent = make_user("+22380007001", "parent", "Action", "Parent")
        self.teacher_user = make_user("+22380007002", "teacher", "Action", "Prof")
        self.teacher = make_teacher_profile(self.teacher_user)
        self.subject = make_subject("Action Subj", "action-subj")

    def _make_pending(self, date_offset=0):
        return make_booking(
            self.teacher, self.parent, self.subject,
            date=datetime.date(2026, 9, 1) + datetime.timedelta(days=date_offset),
        )

    def test_teacher_confirms_pending(self):
        booking = self._make_pending()
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")

    def test_parent_cannot_confirm(self):
        booking = self._make_pending(1)
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_parent_can_cancel_pending(self):
        booking = self._make_pending(2)
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")

    def test_teacher_can_cancel_pending(self):
        booking = self._make_pending(3)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_teacher_can_cancel_confirmed(self):
        booking = make_booking(
            self.teacher, self.parent, self.subject,
            date=datetime.date(2026, 9, 5), status_val="confirmed",
        )
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_teacher_completes_confirmed(self):
        booking = make_booking(
            self.teacher, self.parent, self.subject,
            date=datetime.date(2026, 9, 6), status_val="confirmed",
        )
        initial_count = self.teacher.total_bookings
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/complete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "completed")
        self.teacher.refresh_from_db()
        self.assertEqual(self.teacher.total_bookings, initial_count + 1)

    def test_cannot_complete_pending_booking(self):
        """Transition invalide : pending → completed"""
        booking = self._make_pending(7)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/complete/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_confirm_cancelled_booking(self):
        booking = make_booking(
            self.teacher, self.parent, self.subject,
            date=datetime.date(2026, 9, 8), status_val="cancelled",
        )
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_cancel_completed_booking(self):
        booking = make_booking(
            self.teacher, self.parent, self.subject,
            date=datetime.date(2026, 9, 9), status_val="completed",
        )
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_action_name_returns_400(self):
        booking = self._make_pending(10)
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/teleporter/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_action_on_nonexistent_booking_returns_404(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post("/api/v1/bookings/99999/confirm/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_outsider_cannot_cancel_booking(self):
        booking = self._make_pending(11)
        outsider = make_user("+22380007099", "parent", "Outsider", "User")
        self.client.force_authenticate(user=outsider)
        response = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ─────────────────────────────────────────────────────────────
# API — Avis (Reviews)
# ─────────────────────────────────────────────────────────────


class ReviewAPITests(APITestCase):

    def setUp(self):
        self.parent = make_user("+22380008001", "parent", "Reviewer", "Parent")
        self.teacher_user = make_user("+22380008002", "teacher", "Reviewed", "Prof")
        self.teacher = make_teacher_profile(self.teacher_user, hourly_rate=4000)
        self.subject = make_subject("Avis Subj", "avis-subj")
        self.completed_booking = make_booking(
            self.teacher, self.parent, self.subject,
            date=datetime.date(2026, 5, 10), status_val="completed",
        )
        self.pending_booking = make_booking(
            self.teacher, self.parent, self.subject,
            date=datetime.date(2026, 8, 10), status_val="pending",
        )

    def test_create_review_for_completed_booking(self):
        self.client.force_authenticate(user=self.parent)
        data = {
            "teacher": self.teacher.id,
            "booking": self.completed_booking.id,
            "rating": 5,
            "comment": "Très bon professeur, cours clair et bien structuré!",
        }
        response = self.client.post("/api/v1/bookings/reviews/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["rating"], 5)

    def test_review_updates_teacher_avg_rating(self):
        self.client.force_authenticate(user=self.parent)
        data = {
            "teacher": self.teacher.id,
            "booking": self.completed_booking.id,
            "rating": 4,
            "comment": "Bien.",
        }
        self.client.post("/api/v1/bookings/reviews/", data, format="json")
        self.teacher.refresh_from_db()
        self.assertEqual(self.teacher.avg_rating, 4.0)
        self.assertEqual(self.teacher.total_reviews, 1)

    def test_cannot_review_pending_booking(self):
        self.client.force_authenticate(user=self.parent)
        data = {
            "teacher": self.teacher.id,
            "booking": self.pending_booking.id,
            "rating": 3,
            "comment": "Tentative invalide",
        }
        response = self.client.post("/api/v1/bookings/reviews/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_review_other_parents_booking(self):
        other_parent = make_user("+22380008003", "parent", "Other", "Parent")
        self.client.force_authenticate(user=other_parent)
        data = {
            "teacher": self.teacher.id,
            "booking": self.completed_booking.id,
            "rating": 5,
            "comment": "Pas le mien",
        }
        response = self.client.post("/api/v1/bookings/reviews/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_reviews_is_public(self):
        response = self.client.get(f"/api/v1/bookings/reviews/{self.teacher.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_reviews_returns_reviews_for_teacher(self):
        from kalanconnect.bookings.models import Review
        Review.objects.create(
            teacher=self.teacher, parent=self.parent,
            booking=self.completed_booking, rating=4,
        )
        response = self.client.get(f"/api/v1/bookings/reviews/{self.teacher.id}/")
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)

    def test_unauthenticated_cannot_create_review(self):
        data = {
            "teacher": self.teacher.id,
            "booking": self.completed_booking.id,
            "rating": 5,
        }
        response = self.client.post("/api/v1/bookings/reviews/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Packs de cours
# ─────────────────────────────────────────────────────────────


class BookingPackAPITests(APITestCase):

    def setUp(self):
        self.parent = make_user("+22380009001", "parent", "Pack", "Parent")
        make_active_subscription(self.parent)
        self.teacher_user = make_user("+22380009002", "teacher", "Pack", "Prof")
        self.teacher = make_teacher_profile(self.teacher_user, hourly_rate=5000)
        self.subject = make_subject("Pack API Subj", "pack-api-subj")
        self.client.force_authenticate(user=self.parent)

    def test_create_single_pack(self):
        data = {
            "pack_type": "single",
            "teacher": self.teacher.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["pack_type"], "single")
        self.assertEqual(response.data["discount_percent"], 0)

    def test_create_pack4_has_discount(self):
        data = {
            "pack_type": "pack_4",
            "teacher": self.teacher.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["discount_percent"], 10)
        self.assertEqual(response.data["total_sessions"], 4)

    def test_create_pack8_has_bigger_discount(self):
        data = {
            "pack_type": "pack_8",
            "teacher": self.teacher.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["discount_percent"], 15)
        self.assertEqual(response.data["total_sessions"], 8)

    def test_create_monthly_pack(self):
        data = {
            "pack_type": "monthly",
            "teacher": self.teacher.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["discount_percent"], 20)
        self.assertEqual(response.data["total_sessions"], 12)
        self.assertIsNotNone(response.data["expires_at"])

    def test_list_active_packs(self):
        data = {
            "pack_type": "single",
            "teacher": self.teacher.id,
            "subject": self.subject.id,
        }
        self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        response = self.client.get("/api/v1/bookings/packs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_without_subscription_cannot_create_pack(self):
        parent_no_sub = make_user("+22380009003", "parent", "NoSub", "Pack")
        self.client.force_authenticate(user=parent_no_sub)
        data = {
            "pack_type": "single",
            "teacher": self.teacher.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_pack_type_fails(self):
        data = {
            "pack_type": "invalide",
            "teacher": self.teacher.id,
            "subject": self.subject.id,
        }
        response = self.client.post("/api/v1/bookings/packs/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# API — Signalements
# ─────────────────────────────────────────────────────────────


class ReportAPITests(APITestCase):

    def setUp(self):
        self.reporter = make_user("+22380010001", "parent", "Reporter", "User")
        self.reported = make_user("+22380010002", "teacher", "Reported", "User")
        self.admin = make_user("+22380010003", "admin", "Admin", "User")

    def test_authenticated_user_can_create_report(self):
        self.client.force_authenticate(user=self.reporter)
        data = {
            "reported_user": self.reported.id,
            "reason": "bad_behavior",
            "description": "Le professeur a eu un comportement inapproprié pendant la séance.",
        }
        response = self.client.post("/api/v1/bookings/reports/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")

    def test_unauthenticated_cannot_create_report(self):
        data = {
            "reported_user": self.reported.id,
            "reason": "fraud",
            "description": "Tentative anonyme.",
        }
        response = self.client.post("/api/v1/bookings/reports/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_list_reports(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/reports/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_non_admin_cannot_list_reports(self):
        self.client.force_authenticate(user=self.reporter)
        response = self.client.get("/api/v1/admin/reports/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_report_status(self):
        from kalanconnect.bookings.models import Report
        report = Report.objects.create(
            reporter=self.reporter, reported_user=self.reported,
            reason="fraud", description="Description complète du signalement.",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f"/api/v1/admin/reports/{report.id}/", {
            "status": "resolved",
            "admin_notes": "Dossier traité et résolu.",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_filter_reports_by_status(self):
        from kalanconnect.bookings.models import Report
        Report.objects.create(
            reporter=self.reporter, reported_user=self.reported,
            reason="no_show", description="Le professeur n'est pas venu.",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/reports/?status=pending")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        for r in results:
            self.assertEqual(r["status"], "pending")
