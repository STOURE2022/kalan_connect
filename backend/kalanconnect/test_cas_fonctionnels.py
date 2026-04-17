"""
KalanConnect — Tests de fonctionnement (cas bout-en-bout)
==========================================================
Chaque cas simule un parcours réel complet avec plusieurs étapes enchaînées.
Un cas = une histoire utilisateur de A à Z.

Lancer :
  venv/Scripts/python manage.py test kalanconnect.test_cas_fonctionnels
  venv/Scripts/python manage.py test kalanconnect.test_cas_fonctionnels.CasReservationComplete
"""

import datetime

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

TINY_GIF = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00"
    b"!\xf9\x04\x00\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01"
    b"\x00\x00\x02\x02D\x01\x00;"
)


# ─────────────────────────────────────────────────────────────────────────────
# CAS 1 — Parcours complet : parent réserve, prof confirme, cours terminé, avis
# ─────────────────────────────────────────────────────────────────────────────

class CasReservationComplete(APITestCase):
    """
    Histoire : Aminata est parent. Elle s'inscrit, souscrit un abonnement,
    trouve le professeur Moussa, réserve un cours, Moussa confirme,
    marque le cours terminé, Aminata laisse un avis 5 étoiles.
    """

    def test_parcours_complet_parent_reserve_prof_confirme_puis_avis(self):
        # ── Étape 1 : Aminata s'inscrit ─────────────────────────────────────
        r = self.client.post("/api/v1/auth/register/", {
            "phone": "+22301001001",
            "first_name": "Aminata",
            "last_name": "Diallo",
            "password": "Secure123!",
            "password_confirm": "Secure123!",
            "role": "parent",
            "city": "Bamako",
        }, format="json")
        self.assertEqual(r.status_code, 201, f"Étape 1 échouée : {r.data}")
        aminata = User.objects.get(phone="+22301001001")
        access_aminata = r.data["tokens"]["access"]

        # ── Étape 2 : Aminata souscrit un abonnement mensuel ────────────────
        from kalanconnect.payments.models import Subscription
        sub = Subscription.objects.create(
            user=aminata, plan="monthly", status="active",
            start_date=timezone.now(),
            end_date=timezone.now() + datetime.timedelta(days=30),
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_aminata}")
        r = self.client.get("/api/v1/payments/check-subscription/")
        self.assertTrue(r.data["has_subscription"], "Étape 2 : abonnement non détecté")

        # ── Étape 3 : Moussa le prof crée son profil ─────────────────────────
        moussa = User.objects.create_user(
            phone="+22301001002", first_name="Moussa", last_name="Traoré",
            password="Prof123!", role="teacher",
        )
        from kalanconnect.teachers.models import TeacherProfile, Subject
        subject = Subject.objects.create(
            name="Mathématiques", slug="maths-cas1", category="sciences", is_active=True
        )
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        teacher_profile = TeacherProfile.objects.create(
            user=moussa, bio="Expert maths.", hourly_rate=5000,
            city="Bamako", neighborhood="Hamdallaye", photo=photo,
        )

        # ── Étape 4 : Aminata cherche un professeur ──────────────────────────
        r = self.client.get("/api/v1/teachers/search/?city=Bamako")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertTrue(any(t["id"] == teacher_profile.id for t in results),
                        "Étape 4 : Moussa non trouvé dans la recherche")

        # ── Étape 5 : Aminata consulte la fiche de Moussa ───────────────────
        r = self.client.get(f"/api/v1/teachers/{teacher_profile.id}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["id"], teacher_profile.id)

        # ── Étape 6 : Aminata réserve un cours ──────────────────────────────
        booking_date = (timezone.now() + datetime.timedelta(days=5)).date()
        r = self.client.post("/api/v1/bookings/create/", {
            "teacher": teacher_profile.id,
            "subject": subject.id,
            "date": str(booking_date),
            "start_time": "09:00",
            "end_time": "10:00",
            "location_type": "at_student",
            "notes": "Mon fils est en 3ème.",
        }, format="json")
        self.assertEqual(r.status_code, 201, f"Étape 6 échouée : {r.data}")
        from kalanconnect.bookings.models import Booking
        booking = Booking.objects.filter(parent=aminata).latest("created_at")
        self.assertEqual(booking.status, "pending")
        self.assertEqual(booking.price, 5000)  # 1h × 5000 FCFA

        # ── Étape 7 : Aminata voit la réservation dans sa liste ─────────────
        r = self.client.get("/api/v1/bookings/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertTrue(any(b["id"] == booking.id for b in results),
                        "Étape 7 : réservation non visible pour Aminata")

        # ── Étape 8 : Moussa voit la réservation en attente ─────────────────
        self.client.force_authenticate(user=moussa)
        r = self.client.get("/api/v1/bookings/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertTrue(any(b["id"] == booking.id for b in results),
                        "Étape 8 : réservation non visible pour Moussa")

        # ── Étape 9 : Moussa confirme le cours ──────────────────────────────
        r = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(r.status_code, 200, f"Étape 9 échouée : {r.data}")
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")

        # ── Étape 10 : Aminata reçoit une notification de confirmation ───────
        from kalanconnect.chat.models import AppNotification
        notif = AppNotification.objects.filter(user=aminata, type="booking").first()
        self.assertIsNotNone(notif, "Étape 10 : notification de confirmation manquante")
        self.assertIn("confirmé", notif.message.lower())

        # ── Étape 11 : Moussa marque le cours comme terminé ──────────────────
        r = self.client.post(f"/api/v1/bookings/{booking.id}/complete/")
        self.assertEqual(r.status_code, 200, f"Étape 11 échouée : {r.data}")
        booking.refresh_from_db()
        self.assertEqual(booking.status, "completed")

        # ── Étape 12 : Les stats de Moussa sont mises à jour ─────────────────
        teacher_profile.refresh_from_db()
        self.assertEqual(teacher_profile.total_bookings, 1)

        # ── Étape 13 : Aminata reçoit une notif pour laisser un avis ─────────
        notif_review = AppNotification.objects.filter(user=aminata, type="review").first()
        self.assertIsNotNone(notif_review, "Étape 13 : notification d'avis manquante")

        # ── Étape 14 : Aminata laisse un avis 5 étoiles ──────────────────────
        self.client.force_authenticate(user=aminata)
        r = self.client.post("/api/v1/bookings/reviews/", {
            "teacher": teacher_profile.id,
            "booking": booking.id,
            "rating": 5,
            "comment": "Excellent professeur, très patient !",
        }, format="json")
        self.assertEqual(r.status_code, 201, f"Étape 14 échouée : {r.data}")

        # ── Étape 15 : La note moyenne de Moussa est mise à jour ─────────────
        teacher_profile.refresh_from_db()
        self.assertEqual(teacher_profile.avg_rating, 5.0)
        self.assertEqual(teacher_profile.total_reviews, 1)

        # ── Étape 16 : Aminata voit les avis du prof ─────────────────────────
        r = self.client.get(f"/api/v1/bookings/reviews/{teacher_profile.id}/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertGreaterEqual(len(results), 1)


# ─────────────────────────────────────────────────────────────────────────────
# CAS 2 — Étudiant achète un pack, prof le confirme, sessions suivies
# ─────────────────────────────────────────────────────────────────────────────

class CasEtudiantAvecPack(APITestCase):
    """
    Histoire : Oumar est étudiant. Il s'inscrit, souscrit, achète un pack
    de 4 cours avec 10% de remise, réserve des cours individuels dessus.
    """

    def test_etudiant_achete_pack_et_reserve(self):
        # ── Étape 1 : Oumar s'inscrit comme étudiant ────────────────────────
        r = self.client.post("/api/v1/auth/register/", {
            "phone": "+22302001001",
            "first_name": "Oumar",
            "last_name": "Bah",
            "password": "Etudiant123!",
            "password_confirm": "Etudiant123!",
            "role": "etudiant",
        }, format="json")
        self.assertEqual(r.status_code, 201)
        oumar = User.objects.get(phone="+22302001001")

        # ── Étape 2 : Oumar souscrit un abonnement ──────────────────────────
        from kalanconnect.payments.models import Subscription
        Subscription.objects.create(
            user=oumar, plan="monthly", status="active",
            start_date=timezone.now(),
            end_date=timezone.now() + datetime.timedelta(days=30),
        )
        self.client.force_authenticate(user=oumar)

        # ── Étape 3 : Création du prof ───────────────────────────────────────
        prof = User.objects.create_user(
            phone="+22302001002", first_name="Sory", last_name="Kouyaté",
            password="Prof123!", role="teacher",
        )
        from kalanconnect.teachers.models import TeacherProfile, Subject
        subject = Subject.objects.create(
            name="Chimie", slug="chimie-cas2", category="sciences", is_active=True
        )
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        teacher_profile = TeacherProfile.objects.create(
            user=prof, bio="Chimiste.", hourly_rate=4000,
            city="Bamako", neighborhood="ACI", photo=photo,
        )

        # ── Étape 4 : Oumar achète un Pack 4 (−10%) ─────────────────────────
        r = self.client.post("/api/v1/bookings/packs/create/", {
            "pack_type": "pack_4",
            "teacher": teacher_profile.id,
            "subject": subject.id,
        }, format="json")
        self.assertEqual(r.status_code, 201, f"Étape 4 échouée : {r.data}")
        self.assertEqual(r.data["total_sessions"], 4)
        self.assertEqual(r.data["discount_percent"], 10)
        expected_price = int(4000 * 4 * 0.90)  # 14 400 FCFA
        self.assertEqual(r.data["total_price"], expected_price)
        self.assertEqual(r.data["remaining_sessions"], 4)

        # ── Étape 5 : Le pack est visible dans la liste ──────────────────────
        r = self.client.get("/api/v1/bookings/packs/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], "active")

        # ── Étape 6 : Oumar réserve un cours individuel ──────────────────────
        booking_date = (timezone.now() + datetime.timedelta(days=3)).date()
        r = self.client.post("/api/v1/bookings/create/", {
            "teacher": teacher_profile.id,
            "subject": subject.id,
            "date": str(booking_date),
            "start_time": "14:00",
            "end_time": "15:00",
            "location_type": "online",
        }, format="json")
        self.assertEqual(r.status_code, 201)

        # ── Étape 7 : Oumar voit ses réservations ───────────────────────────
        r = self.client.get("/api/v1/bookings/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertEqual(len(results), 1)

    def test_pack_mensuel_remise_20_pourcent(self):
        """Pack mensuel (12 cours) → remise 20%, tarif correct."""
        prof = User.objects.create_user(
            phone="+22302002001", first_name="Ali", last_name="Coulibaly",
            password="Prof123!", role="teacher",
        )
        from kalanconnect.teachers.models import TeacherProfile, Subject
        subject = Subject.objects.create(
            name="Français", slug="francais-cas2b", category="lettres", is_active=True
        )
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        teacher_profile = TeacherProfile.objects.create(
            user=prof, bio="Littéraire.", hourly_rate=3000,
            city="Bamako", neighborhood="Lafiabougou", photo=photo,
        )
        etudiant = User.objects.create_user(
            phone="+22302002002", first_name="Mariam", last_name="Sanogo",
            password="Etudiant123!", role="etudiant",
        )
        from kalanconnect.payments.models import Subscription
        Subscription.objects.create(
            user=etudiant, plan="monthly", status="active",
            start_date=timezone.now(),
            end_date=timezone.now() + datetime.timedelta(days=30),
        )
        self.client.force_authenticate(user=etudiant)
        r = self.client.post("/api/v1/bookings/packs/create/", {
            "pack_type": "monthly",
            "teacher": teacher_profile.id,
            "subject": subject.id,
        }, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["total_sessions"], 12)
        self.assertEqual(r.data["discount_percent"], 20)
        # 3000 × 12 × 0.80 = 28 800 FCFA
        self.assertEqual(r.data["total_price"], int(3000 * 12 * 0.80))


# ─────────────────────────────────────────────────────────────────────────────
# CAS 3 — Conflit de créneaux : deux parents veulent le même horaire
# ─────────────────────────────────────────────────────────────────────────────

class CasConflitCreneaux(APITestCase):
    """
    Histoire : Deux parents essaient de réserver le même prof au même horaire.
    Le premier qui réserve obtient le créneau, le second reçoit une erreur.
    """

    def test_deux_parents_meme_creneau_le_second_est_refuse(self):
        # ── Setup ─────────────────────────────────────────────────────────────
        from kalanconnect.teachers.models import TeacherProfile, Subject
        from kalanconnect.payments.models import Subscription

        prof = User.objects.create_user(
            phone="+22303001001", first_name="Bakary", last_name="Diarra",
            password="Prof123!", role="teacher",
        )
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        teacher_profile = TeacherProfile.objects.create(
            user=prof, bio="Prof.", hourly_rate=5000,
            city="Bamako", neighborhood="Badalabougou", photo=photo,
        )
        subject = Subject.objects.create(
            name="Histoire", slug="histoire-cas3", category="lettres", is_active=True
        )
        parent1 = User.objects.create_user(
            phone="+22303001002", first_name="Kadiatou", last_name="Keïta",
            password="Parent123!", role="parent",
        )
        parent2 = User.objects.create_user(
            phone="+22303001003", first_name="Ibrahim", last_name="Coulibaly",
            password="Parent123!", role="parent",
        )
        Subscription.objects.create(
            user=parent1, plan="monthly", status="active",
            start_date=timezone.now(),
            end_date=timezone.now() + datetime.timedelta(days=30),
        )
        Subscription.objects.create(
            user=parent2, plan="monthly", status="active",
            start_date=timezone.now(),
            end_date=timezone.now() + datetime.timedelta(days=30),
        )

        booking_date = str((timezone.now() + datetime.timedelta(days=7)).date())
        slot = {
            "teacher": teacher_profile.id,
            "subject": subject.id,
            "date": booking_date,
            "start_time": "10:00",
            "end_time": "11:00",
            "location_type": "at_student",
        }

        # ── Étape 1 : Parent1 réserve en premier ────────────────────────────
        self.client.force_authenticate(user=parent1)
        r1 = self.client.post("/api/v1/bookings/create/", slot, format="json")
        self.assertEqual(r1.status_code, 201, "Parent1 devrait pouvoir réserver")

        # ── Étape 2 : Parent2 tente le même créneau → rejeté ────────────────
        self.client.force_authenticate(user=parent2)
        r2 = self.client.post("/api/v1/bookings/create/", slot, format="json")
        self.assertEqual(r2.status_code, 400, "Parent2 devrait être rejeté (conflit)")

        # ── Étape 3 : Parent1 peut annuler → le créneau se libère ────────────
        from kalanconnect.bookings.models import Booking
        booking = Booking.objects.filter(parent=parent1).first()
        self.client.force_authenticate(user=parent1)
        r3 = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(r3.status_code, 200)

        # ── Étape 4 : Parent2 réserve maintenant → accepté ───────────────────
        self.client.force_authenticate(user=parent2)
        r4 = self.client.post("/api/v1/bookings/create/", slot, format="json")
        self.assertEqual(r4.status_code, 201, "Parent2 devrait pouvoir réserver après annulation")


# ─────────────────────────────────────────────────────────────────────────────
# CAS 4 — Signalement et traitement par l'admin
# ─────────────────────────────────────────────────────────────────────────────

class CasSignalementAdmin(APITestCase):
    """
    Histoire : Un parent signale un professeur pour absence. L'admin examine,
    puis résout le signalement avec des notes.
    """

    def test_signalement_complet_de_la_creation_a_la_resolution(self):
        # ── Setup ─────────────────────────────────────────────────────────────
        admin = User.objects.create_user(
            phone="+22304001001", first_name="Admin", last_name="KalanConnect",
            password="Admin123!", role="admin",
        )
        parent = User.objects.create_user(
            phone="+22304001002", first_name="Fatoumata", last_name="Sidibé",
            password="Parent123!", role="parent",
        )
        prof = User.objects.create_user(
            phone="+22304001003", first_name="Sékou", last_name="Koné",
            password="Prof123!", role="teacher",
        )

        # ── Étape 1 : Parent signale le prof ─────────────────────────────────
        self.client.force_authenticate(user=parent)
        r = self.client.post("/api/v1/bookings/reports/", {
            "reported_user": prof.id,
            "reason": "bad_behavior",
            "description": "Le professeur n'est pas venu au cours prévu sans prévenir.",
        }, format="json")
        self.assertEqual(r.status_code, 201, f"Étape 1 échouée : {r.data}")
        from kalanconnect.bookings.models import Report
        report = Report.objects.filter(reporter=parent).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.status, "pending")
        self.assertEqual(report.reason, "bad_behavior")

        # ── Étape 2 : L'admin voit le signalement ────────────────────────────
        self.client.force_authenticate(user=admin)
        r = self.client.get("/api/v1/admin/reports/?status=pending")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertTrue(any(rep["id"] == report.id for rep in results),
                        "Étape 2 : le signalement n'est pas visible par l'admin")

        # ── Étape 3 : L'admin marque "en examen" ─────────────────────────────
        r = self.client.patch(f"/api/v1/admin/reports/{report.id}/", {
            "status": "reviewed",
            "admin_notes": "En cours d'examen, contact du professeur en cours.",
        }, format="json")
        self.assertEqual(r.status_code, 200)
        report.refresh_from_db()
        self.assertEqual(report.status, "reviewed")

        # ── Étape 4 : L'admin résout ──────────────────────────────────────────
        r = self.client.patch(f"/api/v1/admin/reports/{report.id}/", {
            "status": "resolved",
            "admin_notes": "Le professeur a été averti. Remboursement accordé au parent.",
        }, format="json")
        self.assertEqual(r.status_code, 200)
        report.refresh_from_db()
        self.assertEqual(report.status, "resolved")
        self.assertIn("Remboursement", report.admin_notes)

        # ── Étape 5 : Le signalement ne figure plus dans "pending" ────────────
        r = self.client.get("/api/v1/admin/reports/?status=pending")
        results = r.data.get("results", r.data)
        self.assertFalse(any(rep["id"] == report.id for rep in results),
                         "Étape 5 : le signalement résolu ne devrait pas être dans pending")

    def test_signalement_rejete_non_fonde(self):
        """Cas où l'admin considère le signalement infondé → dismissed."""
        admin = User.objects.create_user(
            phone="+22304002001", first_name="Admin2", last_name="KC",
            password="Admin123!", role="admin",
        )
        parent = User.objects.create_user(
            phone="+22304002002", first_name="Ibrahima", last_name="Bah",
            password="Parent123!", role="parent",
        )
        prof = User.objects.create_user(
            phone="+22304002003", first_name="Awa", last_name="Traoré",
            password="Prof123!", role="teacher",
        )
        from kalanconnect.bookings.models import Report
        report = Report.objects.create(
            reporter=parent, reported_user=prof,
            reason="bad_behavior",
            description="Signalement sans preuves.",
        )
        self.client.force_authenticate(user=admin)
        r = self.client.patch(f"/api/v1/admin/reports/{report.id}/", {
            "status": "dismissed",
            "admin_notes": "Aucune preuve. Signalement rejeté.",
        }, format="json")
        self.assertEqual(r.status_code, 200)
        report.refresh_from_db()
        self.assertEqual(report.status, "dismissed")


# ─────────────────────────────────────────────────────────────────────────────
# CAS 5 — Vérification prof : admin approuve puis rejette
# ─────────────────────────────────────────────────────────────────────────────

class CasVerificationProfesseur(APITestCase):
    """
    Histoire : Sékou crée son profil prof. L'admin le voit en attente,
    l'approuve, Sékou reçoit une notification. Puis un autre prof est refusé.
    """

    def test_approbation_prof_avec_notification(self):
        # ── Setup ─────────────────────────────────────────────────────────────
        admin = User.objects.create_user(
            phone="+22305001001", first_name="Admin", last_name="KC",
            password="Admin123!", role="admin",
        )
        sekou = User.objects.create_user(
            phone="+22305001002", first_name="Sékou", last_name="Koné",
            password="Prof123!", role="teacher",
        )
        from kalanconnect.teachers.models import TeacherProfile
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        profile = TeacherProfile.objects.create(
            user=sekou, bio="Prof de physique.", hourly_rate=4500,
            city="Bamako", neighborhood="Magnambougou", photo=photo,
        )

        # ── Étape 1 : L'admin voit Sékou dans la liste "en attente" ──────────
        self.client.force_authenticate(user=admin)
        r = self.client.get("/api/v1/admin/teachers/pending/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        pending_ids = [t["id"] for t in results]
        self.assertIn(profile.id, pending_ids, "Sékou devrait être en attente de vérification")

        # ── Étape 2 : L'admin approuve Sékou ─────────────────────────────────
        r = self.client.post(f"/api/v1/admin/teachers/{profile.id}/verify/", {
            "approved": True,
        }, format="json")
        self.assertEqual(r.status_code, 200)
        profile.refresh_from_db()
        self.assertTrue(profile.is_verified)

        # ── Étape 3 : Sékou reçoit une notification de validation ────────────
        from kalanconnect.chat.models import AppNotification
        notif = AppNotification.objects.filter(user=sekou).first()
        self.assertIsNotNone(notif, "Sékou devrait avoir reçu une notification")
        self.assertIn("vérifié", notif.title.lower())

        # ── Étape 4 : Sékou n'apparaît plus dans la liste en attente ─────────
        r = self.client.get("/api/v1/admin/teachers/pending/")
        results = r.data.get("results", r.data)
        pending_ids = [t["id"] for t in results]
        self.assertNotIn(profile.id, pending_ids, "Sékou approuvé ne devrait plus être en attente")

        # ── Étape 5 : Sékou apparaît comme vérifié sur sa fiche publique ─────
        r = self.client.get(f"/api/v1/teachers/{profile.id}/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["is_verified"])

    def test_rejet_prof_avec_raison(self):
        """L'admin rejette un prof avec une raison → notification avec raison."""
        admin = User.objects.create_user(
            phone="+22305002001", first_name="Admin", last_name="KC2",
            password="Admin123!", role="admin",
        )
        prof = User.objects.create_user(
            phone="+22305002002", first_name="Lamine", last_name="Diabaté",
            password="Prof123!", role="teacher",
        )
        from kalanconnect.teachers.models import TeacherProfile
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        profile = TeacherProfile.objects.create(
            user=prof, bio="Nouveau prof.", hourly_rate=3000,
            city="Sikasso", neighborhood="Centre", photo=photo,
        )
        self.client.force_authenticate(user=admin)
        r = self.client.post(f"/api/v1/admin/teachers/{profile.id}/verify/", {
            "approved": False,
            "reason": "Diplômes non conformes aux exigences de la plateforme.",
        }, format="json")
        self.assertEqual(r.status_code, 200)
        profile.refresh_from_db()
        self.assertFalse(profile.is_verified)

        from kalanconnect.chat.models import AppNotification
        notif = AppNotification.objects.filter(user=prof).first()
        self.assertIsNotNone(notif)
        self.assertIn("refus", notif.title.lower())
        self.assertIn("Diplômes non conformes", notif.message)


# ─────────────────────────────────────────────────────────────────────────────
# CAS 6 — Alerte qualité : 3 mauvaises notes → notification aux admins
# ─────────────────────────────────────────────────────────────────────────────

class CasAlerteQualite(APITestCase):
    """
    Histoire : Un professeur reçoit 3 mauvaises notes consécutives.
    La moyenne tombe sous 2.5/5. Le système crée automatiquement
    une notification pour les administrateurs.
    """

    def test_alerte_automatique_quand_moyenne_sous_2_5(self):
        from kalanconnect.teachers.models import TeacherProfile, Subject
        from kalanconnect.payments.models import Subscription
        from kalanconnect.chat.models import AppNotification

        # ── Setup : admin, prof, matière ─────────────────────────────────────
        admin = User.objects.create_user(
            phone="+22306001001", first_name="Admin", last_name="KC",
            password="Admin123!", role="admin",
        )
        prof = User.objects.create_user(
            phone="+22306001002", first_name="Demba", last_name="Konaté",
            password="Prof123!", role="teacher",
        )
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        teacher_profile = TeacherProfile.objects.create(
            user=prof, bio="Prof en difficulté.", hourly_rate=4000,
            city="Bamako", neighborhood="Kalaban", photo=photo,
        )
        subject = Subject.objects.create(
            name="Anglais", slug="anglais-cas6", category="langues", is_active=True
        )

        # ── 3 parents laissent des mauvaises notes ───────────────────────────
        from kalanconnect.bookings.models import Booking
        for i, (rating, phone) in enumerate([
            (2, "+22306001003"),
            (1, "+22306001004"),
            (2, "+22306001005"),
        ]):
            reviewer = User.objects.create_user(
                phone=phone, first_name=f"Parent{i}", last_name="Test",
                password="Parent123!", role="parent",
            )
            Subscription.objects.create(
                user=reviewer, plan="monthly", status="active",
                start_date=timezone.now(),
                end_date=timezone.now() + datetime.timedelta(days=30),
            )
            booking = Booking.objects.create(
                parent=reviewer, teacher=teacher_profile, subject=subject,
                date=(timezone.now() + datetime.timedelta(days=i+1)).date(),
                start_time=datetime.time(9, 0), end_time=datetime.time(10, 0),
                status="completed", price=4000,
            )
            self.client.force_authenticate(user=reviewer)
            r = self.client.post("/api/v1/bookings/reviews/", {
                "teacher": teacher_profile.id,
                "booking": booking.id,
                "rating": rating,
                "comment": "Décevant.",
            }, format="json")
            self.assertEqual(r.status_code, 201, f"Avis {i+1} échoué : {r.data}")

        # ── Vérification : moyenne < 2.5, 3 avis ─────────────────────────────
        teacher_profile.refresh_from_db()
        self.assertLess(teacher_profile.avg_rating, 2.5)
        self.assertEqual(teacher_profile.total_reviews, 3)

        # ── Vérification : notification créée pour l'admin ────────────────────
        notif = AppNotification.objects.filter(
            user=admin, type="system", title__icontains="alerte"
        ).first()
        self.assertIsNotNone(notif, "Une notification d'alerte devrait être envoyée à l'admin")
        self.assertIn("/5", notif.message)  # contient la note moyenne
        self.assertIn("Demba", notif.message)  # contient le nom du prof

    def test_pas_alerte_si_moins_de_3_avis(self):
        """Pas de notification si le prof a moins de 3 avis, même avec mauvaises notes."""
        from kalanconnect.teachers.models import TeacherProfile, Subject
        from kalanconnect.payments.models import Subscription
        from kalanconnect.chat.models import AppNotification

        admin = User.objects.create_user(
            phone="+22306002001", first_name="Admin2", last_name="KC",
            password="Admin123!", role="admin",
        )
        prof = User.objects.create_user(
            phone="+22306002002", first_name="Moussa2", last_name="Test",
            password="Prof123!", role="teacher",
        )
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        teacher_profile = TeacherProfile.objects.create(
            user=prof, bio=".", hourly_rate=4000,
            city="Bamako", neighborhood="Test", photo=photo,
        )
        subject = Subject.objects.create(
            name="Biologie", slug="bio-cas6b", category="sciences", is_active=True
        )
        from kalanconnect.bookings.models import Booking
        # Seulement 2 mauvaises notes → pas d'alerte
        for i, phone in enumerate(["+22306002003", "+22306002004"]):
            reviewer = User.objects.create_user(
                phone=phone, first_name=f"P{i}", last_name="Test",
                password="P123!", role="parent",
            )
            Subscription.objects.create(
                user=reviewer, plan="monthly", status="active",
                start_date=timezone.now(),
                end_date=timezone.now() + datetime.timedelta(days=30),
            )
            booking = Booking.objects.create(
                parent=reviewer, teacher=teacher_profile, subject=subject,
                date=(timezone.now() + datetime.timedelta(days=i+1)).date(),
                start_time=datetime.time(10, 0), end_time=datetime.time(11, 0),
                status="completed", price=4000,
            )
            self.client.force_authenticate(user=reviewer)
            self.client.post("/api/v1/bookings/reviews/", {
                "teacher": teacher_profile.id,
                "booking": booking.id,
                "rating": 1,
                "comment": "Nul.",
            }, format="json")

        notif = AppNotification.objects.filter(user=admin, type="system").first()
        self.assertIsNone(notif, "Pas d'alerte attendue avec seulement 2 avis")


# ─────────────────────────────────────────────────────────────────────────────
# CAS 7 — Machine à états des réservations
# ─────────────────────────────────────────────────────────────────────────────

class CasMachineEtats(APITestCase):
    """
    Histoire : Teste toutes les transitions valides et invalides de l'état
    d'une réservation selon la machine à états définie.
    """

    def setUp(self):
        from kalanconnect.teachers.models import TeacherProfile, Subject
        from kalanconnect.payments.models import Subscription
        self.prof = User.objects.create_user(
            phone="+22307000001", first_name="Amadou", last_name="Sanogo",
            password="Prof123!", role="teacher",
        )
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        self.teacher_profile = TeacherProfile.objects.create(
            user=self.prof, bio=".", hourly_rate=5000,
            city="Bamako", neighborhood="Test", photo=photo,
        )
        self.subject = Subject.objects.create(
            name="SVT", slug="svt-cas7", category="sciences", is_active=True
        )
        self.parent = User.objects.create_user(
            phone="+22307000002", first_name="Kadiatou", last_name="Bah",
            password="Parent123!", role="parent",
        )
        Subscription.objects.create(
            user=self.parent, plan="monthly", status="active",
            start_date=timezone.now(),
            end_date=timezone.now() + datetime.timedelta(days=30),
        )

    def _make_booking(self, date_offset=5, start="09:00", end="10:00", status_val="pending"):
        from kalanconnect.bookings.models import Booking
        return Booking.objects.create(
            parent=self.parent, teacher=self.teacher_profile, subject=self.subject,
            date=(timezone.now() + datetime.timedelta(days=date_offset)).date(),
            start_time=datetime.time(9, 0), end_time=datetime.time(10, 0),
            status=status_val, price=5000,
        )

    def test_transition_pending_vers_confirmed(self):
        """pending → confirmed : le prof confirme."""
        booking = self._make_booking()
        self.client.force_authenticate(user=self.prof)
        r = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(r.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")

    def test_transition_confirmed_vers_completed(self):
        """confirmed → completed : le prof marque terminé."""
        booking = self._make_booking(status_val="confirmed")
        self.client.force_authenticate(user=self.prof)
        r = self.client.post(f"/api/v1/bookings/{booking.id}/complete/")
        self.assertEqual(r.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "completed")

    def test_transition_pending_vers_cancelled_par_parent(self):
        """pending → cancelled : le parent annule."""
        booking = self._make_booking()
        self.client.force_authenticate(user=self.parent)
        r = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(r.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")

    def test_transition_confirmed_vers_cancelled_par_prof(self):
        """confirmed → cancelled : le prof annule."""
        booking = self._make_booking(status_val="confirmed")
        self.client.force_authenticate(user=self.prof)
        r = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(r.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")

    def test_transition_invalide_pending_vers_completed(self):
        """pending → completed : IMPOSSIBLE (doit d'abord être confirmé)."""
        booking = self._make_booking()
        self.client.force_authenticate(user=self.prof)
        r = self.client.post(f"/api/v1/bookings/{booking.id}/complete/")
        self.assertEqual(r.status_code, 400)

    def test_transition_invalide_completed_vers_cancelled(self):
        """completed → cancelled : IMPOSSIBLE (cours terminé)."""
        booking = self._make_booking(status_val="completed")
        self.client.force_authenticate(user=self.prof)
        r = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(r.status_code, 400)

    def test_transition_invalide_cancelled_vers_confirmed(self):
        """cancelled → confirmed : IMPOSSIBLE."""
        booking = self._make_booking(status_val="cancelled")
        self.client.force_authenticate(user=self.prof)
        r = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(r.status_code, 400)

    def test_parent_ne_peut_pas_confirmer(self):
        """Seul le prof peut confirmer → le parent reçoit 403."""
        booking = self._make_booking()
        self.client.force_authenticate(user=self.parent)
        r = self.client.post(f"/api/v1/bookings/{booking.id}/confirm/")
        self.assertEqual(r.status_code, 403)

    def test_tiers_ne_peut_pas_annuler(self):
        """Un utilisateur étranger à la réservation reçoit 403."""
        booking = self._make_booking()
        stranger = User.objects.create_user(
            phone="+22307000003", first_name="Autre", last_name="User",
            password="Other123!", role="parent",
        )
        self.client.force_authenticate(user=stranger)
        r = self.client.post(f"/api/v1/bookings/{booking.id}/cancel/")
        self.assertEqual(r.status_code, 403)


# ─────────────────────────────────────────────────────────────────────────────
# CAS 8 — Chat entre parent et professeur
# ─────────────────────────────────────────────────────────────────────────────

class CasChatParentProfesseur(APITestCase):
    """
    Histoire : Aminata (parent) ouvre une conversation avec Moussa (prof)
    pour lui poser des questions avant de réserver.
    """

    def test_demarrage_conversation_et_isolation(self):
        # ── Setup ─────────────────────────────────────────────────────────────
        parent = User.objects.create_user(
            phone="+22308001001", first_name="Aminata", last_name="Koné",
            password="Parent123!", role="parent",
        )
        prof = User.objects.create_user(
            phone="+22308001002", first_name="Moussa", last_name="Diallo",
            password="Prof123!", role="teacher",
        )
        autre_parent = User.objects.create_user(
            phone="+22308001003", first_name="Autre", last_name="Parent",
            password="Parent123!", role="parent",
        )

        # ── Étape 1 : Aminata démarre une conversation avec Moussa ────────────
        self.client.force_authenticate(user=parent)
        r = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": prof.id,
        }, format="json")
        self.assertEqual(r.status_code, 200)
        conversation_id = r.data["id"]

        # ── Étape 2 : Démarrer la même conversation → idempotent ─────────────
        r2 = self.client.post("/api/v1/chat/conversations/start/", {
            "user_id": prof.id,
        }, format="json")
        self.assertEqual(r2.data["id"], conversation_id, "Doit retourner la même conversation")

        # ── Étape 3 : Aminata voit la conversation dans sa liste ─────────────
        r = self.client.get("/api/v1/chat/conversations/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        conv_ids = [c["id"] for c in results]
        self.assertIn(conversation_id, conv_ids)

        # ── Étape 4 : Aminata peut voir les messages (vide pour l'instant) ────
        r = self.client.get(f"/api/v1/chat/conversations/{conversation_id}/messages/")
        self.assertEqual(r.status_code, 200)

        # ── Étape 5 : Un tiers ne peut pas voir les messages de cette conv ────
        self.client.force_authenticate(user=autre_parent)
        r = self.client.get(f"/api/v1/chat/conversations/{conversation_id}/messages/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertEqual(len(results), 0, "Un tiers ne devrait voir aucun message")

        # ── Étape 6 : Moussa voit aussi la conversation de son côté ──────────
        self.client.force_authenticate(user=prof)
        r = self.client.get("/api/v1/chat/conversations/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        conv_ids = [c["id"] for c in results]
        self.assertIn(conversation_id, conv_ids)

    def test_notifications_dans_le_chat(self):
        """Les notifications de booking sont accessibles et marquables comme lues."""
        from kalanconnect.chat.models import AppNotification
        parent = User.objects.create_user(
            phone="+22308002001", first_name="Test", last_name="Parent",
            password="Parent123!", role="parent",
        )
        # Créer une notification pour ce parent
        notif = AppNotification.objects.create(
            user=parent,
            title="Test notification",
            message="Un message de test.",
            type="booking",
        )
        self.client.force_authenticate(user=parent)

        # Liste des notifications
        r = self.client.get("/api/v1/notifications/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertTrue(any(n["id"] == notif.id for n in results))

        # Compteur de non lus
        r = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("unread_count", r.data)
        self.assertGreaterEqual(r.data["unread_count"], 1)

        # Marquer comme lu
        r = self.client.post(f"/api/v1/notifications/{notif.id}/read/")
        self.assertEqual(r.status_code, 200)

        # Compteur mis à jour
        r = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(r.data["unread_count"], 0)


# ─────────────────────────────────────────────────────────────────────────────
# CAS 9 — Élève consulte son emploi du temps et sa progression
# ─────────────────────────────────────────────────────────────────────────────

class CasEleveEmploiDuTemps(APITestCase):
    """
    Histoire : Ibrahima est élève (student). Il a des cours réservés par son
    parent (qui utilise le compte student). Il consulte son emploi du temps
    et sa progression par matière.
    """

    def test_eleve_voit_ses_cours_a_venir_et_sa_progression(self):
        from kalanconnect.teachers.models import TeacherProfile, Subject
        from kalanconnect.payments.models import Subscription
        from kalanconnect.bookings.models import Booking

        # ── Setup ─────────────────────────────────────────────────────────────
        prof = User.objects.create_user(
            phone="+22309001001", first_name="Karamba", last_name="Kouyaté",
            password="Prof123!", role="teacher",
        )
        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        teacher_profile = TeacherProfile.objects.create(
            user=prof, bio=".", hourly_rate=3500,
            city="Bamako", neighborhood="Test", photo=photo,
        )
        subject_maths = Subject.objects.create(
            name="Maths", slug="maths-cas9", category="sciences", is_active=True
        )
        subject_physique = Subject.objects.create(
            name="Physique", slug="physique-cas9", category="sciences", is_active=True
        )

        # L'élève crée son compte
        ibrahima = User.objects.create_user(
            phone="+22309001002", first_name="Ibrahima", last_name="Keïta",
            password="Eleve123!", role="student",
        )
        Subscription.objects.create(
            user=ibrahima, plan="monthly", status="active",
            start_date=timezone.now(),
            end_date=timezone.now() + datetime.timedelta(days=30),
        )

        # Créer des cours : 2 à venir, 2 terminés
        Booking.objects.create(
            parent=ibrahima, teacher=teacher_profile, subject=subject_maths,
            date=(timezone.now() + datetime.timedelta(days=2)).date(),
            start_time=datetime.time(8, 0), end_time=datetime.time(9, 0),
            status="confirmed", price=3500,
        )
        Booking.objects.create(
            parent=ibrahima, teacher=teacher_profile, subject=subject_maths,
            date=(timezone.now() + datetime.timedelta(days=5)).date(),
            start_time=datetime.time(8, 0), end_time=datetime.time(9, 0),
            status="pending", price=3500,
        )
        Booking.objects.create(
            parent=ibrahima, teacher=teacher_profile, subject=subject_maths,
            date=(timezone.now() - datetime.timedelta(days=3)).date(),
            start_time=datetime.time(8, 0), end_time=datetime.time(9, 0),
            status="completed", price=3500,
        )
        Booking.objects.create(
            parent=ibrahima, teacher=teacher_profile, subject=subject_physique,
            date=(timezone.now() - datetime.timedelta(days=7)).date(),
            start_time=datetime.time(10, 0), end_time=datetime.time(11, 0),
            status="completed", price=3500,
        )

        self.client.force_authenticate(user=ibrahima)

        # ── Étape 1 : Emploi du temps (cours à venir) ─────────────────────────
        r = self.client.get("/api/v1/student/schedule/")
        self.assertEqual(r.status_code, 200)
        schedule = r.data
        self.assertEqual(len(schedule), 2, f"Attendu 2 cours à venir, reçu {len(schedule)}")
        # Vérifier les champs attendus
        for entry in schedule:
            self.assertIn("subject_name", entry)
            self.assertIn("teacher_name", entry)
            self.assertIn("date", entry)
            self.assertIn("start_time", entry)
            self.assertIn("location_type", entry)
            self.assertIn("status", entry)
            self.assertIn(entry["status"], ["pending", "confirmed"])

        # ── Étape 2 : Progression par matière ────────────────────────────────
        r = self.client.get("/api/v1/student/progress/")
        self.assertEqual(r.status_code, 200)
        progress = r.data
        self.assertIsInstance(progress, list)
        self.assertEqual(len(progress), 2, "Attendu 2 matières dans la progression")
        subjects_in_progress = [p["subject"]["name"] for p in progress]
        self.assertIn("Maths", subjects_in_progress)
        self.assertIn("Physique", subjects_in_progress)
        for p in progress:
            self.assertIn("completed_sessions", p)
            self.assertGreaterEqual(p["completed_sessions"], 1)

        # ── Étape 3 : Liste des profs avec qui il a eu des cours ─────────────
        r = self.client.get("/api/v1/student/teachers/")
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(r.data["count"], 1)
        self.assertEqual(r.data["results"][0]["id"], teacher_profile.id)


# ─────────────────────────────────────────────────────────────────────────────
# CAS 10 — Professeur gère son profil complet
# ─────────────────────────────────────────────────────────────────────────────

class CasProfesseurGereProfilComplet(APITestCase):
    """
    Histoire : Fatoumata s'inscrit comme professeur, crée son profil,
    ajoute ses matières, ses diplômes, et ses disponibilités.
    """

    def test_prof_cree_et_complete_son_profil(self):
        # ── Étape 1 : Inscription ─────────────────────────────────────────────
        r = self.client.post("/api/v1/auth/register/", {
            "phone": "+22310001001",
            "first_name": "Fatoumata",
            "last_name": "Touré",
            "password": "Prof2024!",
            "password_confirm": "Prof2024!",
            "role": "teacher",
        }, format="json")
        self.assertEqual(r.status_code, 201)
        fatoumata = User.objects.get(phone="+22310001001")
        self.client.force_authenticate(user=fatoumata)

        # ── Étape 2 : Création du profil avec photo ───────────────────────────
        from kalanconnect.teachers.models import Subject, Level
        subject = Subject.objects.create(
            name="Anglais", slug="anglais-cas10", category="langues", is_active=True
        )
        level = Level.objects.create(name="Terminale", slug="terminale-cas10", order=5)

        photo = SimpleUploadedFile("photo.gif", TINY_GIF, content_type="image/gif")
        r = self.client.post("/api/v1/teachers/profile/", {
            "bio": "Professeure d'anglais certifiée Cambridge.",
            "hourly_rate": 6000,
            "city": "Bamako",
            "neighborhood": "Baco-Djicoroni",
            "experience_years": 8,
            "teaches_online": True,
            "teaches_at_home": True,
            "teaches_at_student": True,
            "photo": photo,
        }, format="multipart")
        self.assertEqual(r.status_code, 201, f"Étape 2 échouée : {r.data}")

        # ── Étape 3 : Consultation de son propre profil ───────────────────────
        r = self.client.get("/api/v1/teachers/me/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["hourly_rate"], 6000)
        self.assertEqual(r.data["city"], "Bamako")  # Profil bien enregistré

        # ── Étape 4 : Ajout d'un diplôme ─────────────────────────────────────
        r = self.client.post("/api/v1/teachers/diplomas/", {
            "title": "Master LLCE Anglais",
            "institution": "Université des Lettres de Bamako",
            "year": 2016,
        }, format="json")
        self.assertEqual(r.status_code, 201, f"Étape 4 échouée : {r.data}")
        diploma_id = r.data["id"]

        r = self.client.get("/api/v1/teachers/diplomas/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Master LLCE Anglais")

        # ── Étape 5 : Ajout de disponibilités ────────────────────────────────
        for day in [1, 3, 5]:  # Lundi, Mercredi, Vendredi
            r = self.client.post("/api/v1/teachers/availability/", {
                "day_of_week": day,
                "start_time": "08:00",
                "end_time": "18:00",
                "is_recurring": True,
            }, format="json")
            self.assertEqual(r.status_code, 201, f"Disponibilité jour {day} échouée")

        r = self.client.get("/api/v1/teachers/availability/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertEqual(len(results), 3)

        # ── Étape 6 : Mise à jour de la bio et du tarif ───────────────────────
        r = self.client.patch("/api/v1/teachers/me/", {
            "bio": "Prof d'anglais certifiée Cambridge avec 8 ans d'expérience.",
            "hourly_rate": 7000,
        }, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["hourly_rate"], 7000)

        # ── Étape 7 : Suppression d'une disponibilité ────────────────────────
        from kalanconnect.teachers.models import Availability
        avail = Availability.objects.filter(teacher__user=fatoumata).first()
        r = self.client.delete(f"/api/v1/teachers/me/availability/{avail.id}/")
        self.assertEqual(r.status_code, 204)

        r = self.client.get("/api/v1/teachers/availability/")
        results = r.data.get("results", r.data)
        self.assertEqual(len(results), 2)

        # ── Étape 8 : Suppression d'un diplôme ───────────────────────────────
        r = self.client.delete(f"/api/v1/teachers/diplomas/{diploma_id}/")
        self.assertEqual(r.status_code, 204)

        r = self.client.get("/api/v1/teachers/diplomas/")
        results = r.data.get("results", r.data)
        self.assertEqual(len(results), 0)

        # ── Étape 9 : Fatoumata apparaît dans la recherche ───────────────────
        r = self.client.get("/api/v1/teachers/search/?city=Bamako")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        found = any(t["user"]["first_name"] == "Fatoumata" for t in results)
        self.assertTrue(found, "Fatoumata devrait apparaître dans la recherche")


# ─────────────────────────────────────────────────────────────────────────────
# CAS 11 — Dashboard admin : vue d'ensemble après activité
# ─────────────────────────────────────────────────────────────────────────────

class CasDashboardAdmin(APITestCase):
    """
    Histoire : L'admin consulte le dashboard après plusieurs inscriptions,
    abonnements et réservations.
    """

    def test_dashboard_reflète_etat_reel_de_la_plateforme(self):
        from kalanconnect.teachers.models import TeacherProfile, Subject
        from kalanconnect.payments.models import Subscription
        from kalanconnect.bookings.models import Booking

        admin = User.objects.create_user(
            phone="+22311001001", first_name="Admin", last_name="KC",
            password="Admin123!", role="admin",
        )

        # Créer des utilisateurs
        parent1 = User.objects.create_user(phone="+22311001002", first_name="P1", last_name="T",
                                           password="p", role="parent")
        parent2 = User.objects.create_user(phone="+22311001003", first_name="P2", last_name="T",
                                           password="p", role="parent")
        student = User.objects.create_user(phone="+22311001004", first_name="S1", last_name="T",
                                           password="p", role="student")
        etudiant = User.objects.create_user(phone="+22311001005", first_name="E1", last_name="T",
                                            password="p", role="etudiant")
        prof = User.objects.create_user(phone="+22311001006", first_name="Prof", last_name="T",
                                        password="p", role="teacher")

        photo = SimpleUploadedFile("p.gif", TINY_GIF, content_type="image/gif")
        teacher_profile = TeacherProfile.objects.create(
            user=prof, bio=".", hourly_rate=5000,
            city="Bamako", neighborhood="T", photo=photo,
        )
        subject = Subject.objects.create(
            name="Géo", slug="geo-cas11", category="sciences", is_active=True
        )

        # Abonnements actifs
        for user in [parent1, etudiant]:
            Subscription.objects.create(
                user=user, plan="monthly", status="active",
                start_date=timezone.now(),
                end_date=timezone.now() + datetime.timedelta(days=30),
            )

        # Réservations
        for i, parent in enumerate([parent1, parent2]):
            Booking.objects.create(
                parent=parent, teacher=teacher_profile, subject=subject,
                date=(timezone.now() + datetime.timedelta(days=i+2)).date(),
                start_time=datetime.time(9, 0), end_time=datetime.time(10, 0),
                status="pending", price=5000,
            )

        # ── Consultation du dashboard ─────────────────────────────────────────
        self.client.force_authenticate(user=admin)
        r = self.client.get("/api/v1/admin/dashboard/")
        self.assertEqual(r.status_code, 200)

        data = r.data
        # +1 car l'admin lui-même est compté dans total_users
        self.assertGreaterEqual(data["total_users"], 6)
        self.assertGreaterEqual(data["total_teachers"], 1)
        self.assertGreaterEqual(data["total_parents"], 2)
        self.assertGreaterEqual(data["total_students"], 2)  # student + etudiant
        self.assertGreaterEqual(data["total_bookings"], 2)
        self.assertGreaterEqual(data["active_subscriptions"], 2)
        self.assertGreaterEqual(data["pending_verifications"], 1)  # prof non vérifié
        self.assertGreaterEqual(data["new_users_this_month"], 6)
        self.assertGreaterEqual(data["bookings_this_month"], 2)

        # ── Liste des utilisateurs avec filtres ───────────────────────────────
        r = self.client.get("/api/v1/admin/users/?role=parent")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertGreaterEqual(len(results), 2)

        r = self.client.get("/api/v1/admin/users/?q=Prof")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertGreaterEqual(len(results), 1)

        # ── Réservations admin ────────────────────────────────────────────────
        r = self.client.get("/api/v1/admin/bookings/")
        self.assertEqual(r.status_code, 200)
        results = r.data.get("results", r.data)
        self.assertGreaterEqual(len(results), 2)

        # ── Revenus ───────────────────────────────────────────────────────────
        r = self.client.get("/api/v1/admin/revenue/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("total_revenue", r.data)
        self.assertIn("monthly_revenue", r.data)
