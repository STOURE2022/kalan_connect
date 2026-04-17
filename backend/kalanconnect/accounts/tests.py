"""
Tests — Application accounts
Couvre : modèles User & Child, inscription, connexion, profil,
         changement de mot de passe, suppression de compte, enfants.
"""

import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────


def make_user(phone, role="parent", first_name="Test", last_name="User", password="testpass123"):
    return User.objects.create_user(
        phone=phone, first_name=first_name, last_name=last_name,
        password=password, role=role,
    )


def make_active_subscription(user):
    from django.utils import timezone
    from kalanconnect.payments.models import Subscription
    return Subscription.objects.create(
        user=user, plan="monthly", status="active",
        start_date=timezone.now(),
        end_date=timezone.now() + datetime.timedelta(days=30),
    )


# ─────────────────────────────────────────────────────────────
# Modèle User
# ─────────────────────────────────────────────────────────────


class UserModelTests(TestCase):

    def test_create_user_with_phone(self):
        user = make_user("+22370000001")
        self.assertEqual(user.phone, "+22370000001")
        self.assertEqual(user.role, User.Role.PARENT)
        self.assertTrue(user.check_password("testpass123"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_without_phone_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(phone="", password="pass", first_name="A", last_name="B")

    def test_create_superuser_sets_flags(self):
        admin = User.objects.create_superuser(
            phone="+22370000002", password="adminpass",
            first_name="Super", last_name="Admin",
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_username_field_is_phone(self):
        self.assertEqual(User.USERNAME_FIELD, "phone")

    def test_default_city_is_bamako(self):
        user = make_user("+22370000003")
        self.assertEqual(user.city, "Bamako")

    def test_is_phone_verified_default_false(self):
        user = make_user("+22370000004")
        self.assertFalse(user.is_phone_verified)

    def test_str_representation(self):
        user = make_user("+22370000005", first_name="Aminata", last_name="Traoré")
        self.assertEqual(str(user), "Aminata Traoré (+22370000005)")

    # --- Propriétés de rôle ---

    def test_is_parent_true(self):
        user = make_user("+22370000010", role="parent")
        self.assertTrue(user.is_parent)
        self.assertFalse(user.is_teacher)
        self.assertFalse(user.is_student)
        self.assertFalse(user.is_etudiant)

    def test_is_teacher_true(self):
        user = make_user("+22370000011", role="teacher")
        self.assertTrue(user.is_teacher)
        self.assertFalse(user.is_parent)

    def test_is_student_true(self):
        user = make_user("+22370000012", role="student")
        self.assertTrue(user.is_student)

    def test_is_etudiant_true(self):
        user = make_user("+22370000013", role="etudiant")
        self.assertTrue(user.is_etudiant)

    # --- has_active_subscription ---

    def test_no_subscription_returns_false(self):
        user = make_user("+22370000020")
        self.assertFalse(user.has_active_subscription)

    def test_active_subscription_returns_true(self):
        user = make_user("+22370000021")
        make_active_subscription(user)
        self.assertTrue(user.has_active_subscription)

    def test_expired_subscription_returns_false(self):
        from kalanconnect.payments.models import Subscription
        user = make_user("+22370000022")
        Subscription.objects.create(user=user, plan="monthly", status="expired")
        self.assertFalse(user.has_active_subscription)

    def test_pending_subscription_returns_false(self):
        from kalanconnect.payments.models import Subscription
        user = make_user("+22370000023")
        Subscription.objects.create(user=user, plan="monthly", status="pending")
        self.assertFalse(user.has_active_subscription)

    def test_teacher_has_active_subscription_always_false(self):
        """Les professeurs n'ont pas besoin d'abonnement."""
        user = make_user("+22370000024", role="teacher")
        make_active_subscription(user)
        self.assertFalse(user.has_active_subscription)

    def test_admin_has_active_subscription_always_false(self):
        user = make_user("+22370000025", role="admin")
        make_active_subscription(user)
        self.assertFalse(user.has_active_subscription)

    def test_etudiant_with_subscription_returns_true(self):
        user = make_user("+22370000026", role="etudiant")
        make_active_subscription(user)
        self.assertTrue(user.has_active_subscription)


# ─────────────────────────────────────────────────────────────
# Modèle Child
# ─────────────────────────────────────────────────────────────


class ChildModelTests(TestCase):

    def setUp(self):
        from kalanconnect.teachers.models import Level
        self.parent = make_user("+22370000100", role="parent")
        self.level = Level.objects.create(name="CM2", slug="cm2", order=5)

    def test_create_child(self):
        from kalanconnect.accounts.models import Child
        child = Child.objects.create(
            parent=self.parent,
            first_name="Junior",
            last_name="Diallo",
            date_of_birth=datetime.date(2015, 3, 10),
            level=self.level,
            school="École Privée de Bamako",
        )
        self.assertEqual(child.parent, self.parent)
        self.assertEqual(child.first_name, "Junior")
        self.assertEqual(child.level, self.level)

    def test_child_str_contains_name(self):
        from kalanconnect.accounts.models import Child
        child = Child.objects.create(parent=self.parent, first_name="Kadiatou", last_name="Coulibaly")
        self.assertIn("Kadiatou", str(child))
        self.assertIn("Coulibaly", str(child))

    def test_child_level_nullable(self):
        from kalanconnect.accounts.models import Child
        child = Child.objects.create(parent=self.parent, first_name="SansNiveau", last_name="X")
        self.assertIsNone(child.level)


# ─────────────────────────────────────────────────────────────
# API — Inscription
# ─────────────────────────────────────────────────────────────


class RegisterAPITests(APITestCase):

    def test_register_parent_success(self):
        data = {
            "phone": "+22370001001",
            "first_name": "Fatou",
            "last_name": "Keïta",
            "password": "securepass123",
            "password_confirm": "securepass123",
            "role": "parent",
        }
        response = self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["phone"], "+22370001001")
        self.assertEqual(response.data["user"]["role"], "parent")

    def test_register_teacher_success(self):
        data = {
            "phone": "+22370001002",
            "first_name": "Ibrahim",
            "last_name": "Sanogo",
            "password": "securepass123",
            "password_confirm": "securepass123",
            "role": "teacher",
        }
        response = self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], "teacher")

    def test_register_password_mismatch_fails(self):
        data = {
            "phone": "+22370001009",
            "first_name": "Mismatch",
            "last_name": "User",
            "password": "securepass123",
            "password_confirm": "autrepass456",
        }
        response = self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_phone_fails(self):
        make_user("+22370001003")
        data = {
            "phone": "+22370001003",
            "first_name": "Doublon",
            "last_name": "User",
            "password": "securepass123",
            "password_confirm": "securepass123",
        }
        response = self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_phone_fails(self):
        data = {"first_name": "Sans", "last_name": "Phone", "password": "test123", "password_confirm": "test123"}
        response = self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_password_fails(self):
        data = {"phone": "+22370001004", "first_name": "Sans", "last_name": "Pass"}
        response = self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_no_auth_required(self):
        """L'endpoint register est public."""
        data = {
            "phone": "+22370001005",
            "first_name": "Public",
            "last_name": "User",
            "password": "testpass123",
            "password_confirm": "testpass123",
        }
        response = self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────
# API — Connexion JWT
# ─────────────────────────────────────────────────────────────


class LoginAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22370002001", password="testpass123")

    def test_login_success_returns_tokens(self):
        response = self.client.post("/api/v1/auth/login/", {
            "phone": "+22370002001",
            "password": "testpass123",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password_returns_401(self):
        response = self.client.post("/api/v1/auth/login/", {
            "phone": "+22370002001",
            "password": "mauvaismdp",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_unknown_phone_returns_401(self):
        response = self.client.post("/api/v1/auth/login/", {
            "phone": "+22399999999",
            "password": "testpass123",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh_works(self):
        login = self.client.post("/api/v1/auth/login/", {
            "phone": "+22370002001",
            "password": "testpass123",
        }, format="json")
        refresh_token = login.data["refresh"]
        response = self.client.post("/api/v1/auth/token/refresh/", {"refresh": refresh_token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)


# ─────────────────────────────────────────────────────────────
# API — Profil
# ─────────────────────────────────────────────────────────────


class ProfileAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22370003001", first_name="Profil", last_name="Test", role="parent")
        self.client.force_authenticate(user=self.user)

    def test_get_profile_returns_own_data(self):
        response = self.client.get("/api/v1/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["phone"], "+22370003001")
        self.assertEqual(response.data["first_name"], "Profil")

    def test_patch_profile_city(self):
        response = self.client.patch("/api/v1/auth/profile/", {"city": "Sikasso"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.city, "Sikasso")

    def test_patch_profile_neighborhood(self):
        response = self.client.patch("/api/v1/auth/profile/", {"neighborhood": "Hamdallaye"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.neighborhood, "Hamdallaye")

    def test_patch_profile_first_name(self):
        response = self.client.patch("/api/v1/auth/profile/", {"first_name": "NouveauPrénom"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "NouveauPrénom")

    def test_profile_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Changement de mot de passe
# ─────────────────────────────────────────────────────────────


class ChangePasswordAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22370004001", password="oldpass123")
        self.client.force_authenticate(user=self.user)

    def test_change_password_success(self):
        response = self.client.post("/api/v1/auth/change-password/", {
            "old_password": "oldpass123",
            "new_password": "newpass456",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpass456"))
        self.assertFalse(self.user.check_password("oldpass123"))

    def test_change_password_wrong_old_password(self):
        response = self.client.post("/api/v1/auth/change-password/", {
            "old_password": "mauvais",
            "new_password": "newpass456",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("oldpass123"))

    def test_change_password_missing_old_password(self):
        response = self.client.post("/api/v1/auth/change-password/", {
            "new_password": "newpass456",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_missing_new_password(self):
        response = self.client.post("/api/v1/auth/change-password/", {
            "old_password": "oldpass123",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_unauthenticated_denied(self):
        self.client.force_authenticate(user=None)
        response = self.client.post("/api/v1/auth/change-password/", {
            "old_password": "oldpass123",
            "new_password": "newpass456",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Suppression de compte
# ─────────────────────────────────────────────────────────────


class DeleteAccountAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22370005001")
        self.client.force_authenticate(user=self.user)

    def test_delete_account_deactivates_user(self):
        response = self.client.delete("/api/v1/auth/account/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_delete_account_does_not_remove_from_db(self):
        self.client.delete("/api/v1/auth/account/")
        self.assertTrue(User.objects.filter(phone="+22370005001").exists())

    def test_delete_account_unauthenticated_denied(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete("/api/v1/auth/account/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Vérification téléphone
# ─────────────────────────────────────────────────────────────


class VerifyPhoneAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22370006001")
        self.client.force_authenticate(user=self.user)

    def test_verify_phone_sets_flag(self):
        self.assertFalse(self.user.is_phone_verified)
        response = self.client.post("/api/v1/auth/verify-phone/", {"otp": "123456"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_phone_verified)


# ─────────────────────────────────────────────────────────────
# API — Gestion des enfants
# ─────────────────────────────────────────────────────────────


class ChildrenAPITests(APITestCase):

    def setUp(self):
        from kalanconnect.teachers.models import Level
        self.parent = make_user("+22370007001", role="parent", first_name="ParentA", last_name="Test")
        self.other_parent = make_user("+22370007002", role="parent", first_name="ParentB", last_name="Test")
        self.level = Level.objects.create(name="5ème", slug="5eme", order=4)
        self.client.force_authenticate(user=self.parent)

    def test_create_child_success(self):
        data = {
            "first_name": "Junior",
            "last_name": "Diallo",
            "date_of_birth": "2015-05-12",
            "level": self.level.id,
            "school": "Lycée Ba Aminata",
        }
        response = self.client.post("/api/v1/children/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["first_name"], "Junior")

    def test_list_returns_only_own_children(self):
        from kalanconnect.accounts.models import Child
        Child.objects.create(parent=self.parent, first_name="EnfantA", last_name="X")
        Child.objects.create(parent=self.parent, first_name="EnfantB", last_name="X")
        Child.objects.create(parent=self.other_parent, first_name="EnfantAutre", last_name="Y")

        response = self.client.get("/api/v1/children/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get("results", response.data)
        self.assertEqual(len(data), 2)

    def test_update_own_child(self):
        from kalanconnect.accounts.models import Child
        child = Child.objects.create(parent=self.parent, first_name="ToUpdate", last_name="Child")
        response = self.client.patch(f"/api/v1/children/{child.id}/", {"first_name": "Updated"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        child.refresh_from_db()
        self.assertEqual(child.first_name, "Updated")

    def test_delete_own_child(self):
        from kalanconnect.accounts.models import Child
        child = Child.objects.create(parent=self.parent, first_name="ToDelete", last_name="Child")
        response = self.client.delete(f"/api/v1/children/{child.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_cannot_access_other_parent_child(self):
        from kalanconnect.accounts.models import Child
        child = Child.objects.create(parent=self.other_parent, first_name="NotMine", last_name="Child")
        response = self.client.get(f"/api/v1/children/{child.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_other_parent_child(self):
        from kalanconnect.accounts.models import Child
        child = Child.objects.create(parent=self.other_parent, first_name="NotMine", last_name="Child")
        response = self.client.delete(f"/api/v1/children/{child.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_cannot_list_children(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/children/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Endpoints étudiant
# ─────────────────────────────────────────────────────────────


class StudentAPITests(APITestCase):

    def setUp(self):
        self.student = make_user("+22370008001", role="student", first_name="Élève", last_name="Test")
        self.client.force_authenticate(user=self.student)

    def test_student_schedule_returns_200(self):
        response = self.client.get("/api/v1/student/schedule/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_progress_returns_200(self):
        response = self.client.get("/api/v1/student/progress/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_teachers_returns_200(self):
        response = self.client.get("/api/v1/student/teachers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_cannot_access_schedule(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/student/schedule/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# Admin — Subscriptions & Reviews endpoints
# ─────────────────────────────────────────────────────────────


class AdminSubscriptionsAPITests(APITestCase):

    def setUp(self):
        import datetime
        from django.utils import timezone
        from kalanconnect.payments.models import Subscription

        self.admin = make_user("+22396001001", role="admin", first_name="Admin", last_name="Super")
        self.parent1 = make_user("+22396001002", role="parent", first_name="ParentA", last_name="Diallo")
        self.parent2 = make_user("+22396001003", role="parent", first_name="ParentB", last_name="Coulibaly")

        now = timezone.now()
        self.sub_active1 = Subscription.objects.create(
            user=self.parent1, plan="monthly", status="active",
            start_date=now,
            end_date=now + datetime.timedelta(days=30),
        )
        self.sub_active2 = Subscription.objects.create(
            user=self.parent2, plan="annual", status="active",
            start_date=now,
            end_date=now + datetime.timedelta(days=365),
        )
        self.sub_expired = Subscription.objects.create(
            user=self.parent1, plan="monthly", status="expired",
            start_date=now - datetime.timedelta(days=60),
            end_date=now - datetime.timedelta(days=30),
        )

    def test_admin_can_list_all_subscriptions(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/subscriptions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_filter_by_status_active(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/subscriptions/?status=active")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data:
            self.assertEqual(item["status"], "active")
        self.assertEqual(len(response.data), 2)

    def test_filter_by_status_expired(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/subscriptions/?status=expired")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["status"], "expired")

    def test_non_admin_cannot_list_subscriptions(self):
        self.client.force_authenticate(user=self.parent1)
        response = self.client.get("/api/v1/admin/subscriptions/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_list_subscriptions(self):
        response = self.client.get("/api/v1/admin/subscriptions/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_subscription_response_contains_user_info(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/subscriptions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_ids = [item["user"]["id"] for item in response.data]
        self.assertIn(self.parent1.id, user_ids)
        sample = next(item for item in response.data if item["user"]["id"] == self.parent1.id
                      and item["id"] == self.sub_active1.id)
        self.assertIn("first_name", sample["user"])
        self.assertIn("last_name", sample["user"])
        self.assertIn("phone", sample["user"])
        self.assertEqual(sample["user"]["first_name"], "ParentA")
        self.assertEqual(sample["user"]["last_name"], "Diallo")
        self.assertEqual(sample["user"]["phone"], "+22396001002")

    def test_subscription_response_contains_plan_and_status(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/subscriptions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data:
            self.assertIn("plan", item)
            self.assertIn("status", item)
            self.assertIn("price", item)
            self.assertIn("start_date", item)
            self.assertIn("end_date", item)
            self.assertIn("auto_renew", item)


class AdminReviewsAPITests(APITestCase):

    def setUp(self):
        import datetime
        from django.utils import timezone
        from kalanconnect.bookings.models import Booking, Review
        from kalanconnect.teachers.models import TeacherProfile, Subject

        self.admin = make_user("+22396002001", role="admin", first_name="Admin", last_name="Reviews")
        self.teacher_user = make_user("+22396002002", role="teacher", first_name="Moussa", last_name="Traore")
        self.parent = make_user("+22396002003", role="parent", first_name="Fatoumata", last_name="Keita")

        self.subject = Subject.objects.create(name="Mathematiques Admin", slug="maths-admin-rev")
        self.teacher_profile = TeacherProfile.objects.create(
            user=self.teacher_user,
            bio="Professeur de maths experimente",
            hourly_rate=2000,
            neighborhood="Badalabougou",
        )

        today = timezone.now().date()
        self.booking1 = Booking.objects.create(
            teacher=self.teacher_profile,
            parent=self.parent,
            subject=self.subject,
            date=today,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(10, 0),
            status="completed",
            price=2000,
        )
        self.booking2 = Booking.objects.create(
            teacher=self.teacher_profile,
            parent=self.parent,
            subject=self.subject,
            date=today,
            start_time=datetime.time(11, 0),
            end_time=datetime.time(12, 0),
            status="completed",
            price=2000,
        )

        self.review5 = Review.objects.create(
            teacher=self.teacher_profile,
            parent=self.parent,
            booking=self.booking1,
            rating=5,
            comment="Excellent professeur !",
        )
        self.review3 = Review.objects.create(
            teacher=self.teacher_profile,
            parent=self.parent,
            booking=self.booking2,
            rating=3,
            comment="Correct mais peut mieux faire.",
        )

    def test_admin_can_list_all_reviews(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/reviews/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 2)

    def test_filter_by_rating(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/reviews/?rating=5")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["rating"], 5)

    def test_non_admin_cannot_list_reviews(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/admin/reviews/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_list_reviews(self):
        response = self.client.get("/api/v1/admin/reviews/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_delete_review(self):
        from kalanconnect.bookings.models import Review
        self.client.force_authenticate(user=self.admin)
        review_id = self.review5.id
        response = self.client.delete(f"/api/v1/admin/reviews/{review_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Review.objects.filter(id=review_id).exists())

    def test_delete_nonexistent_review(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete("/api/v1/admin/reviews/999999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_admin_cannot_delete_review(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.delete(f"/api/v1/admin/reviews/{self.review5.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AdminIncompleteTeachersAPITests(APITestCase):
    """GET /api/v1/admin/teachers/incomplete/ — professeurs sans TeacherProfile."""

    def setUp(self):
        self.admin = make_user("+22396003001", role="admin", first_name="Admin", last_name="Incomplet")
        # Professeur avec profil complet
        self.teacher_with_profile = make_user("+22396003002", role="teacher", first_name="Moussa", last_name="Coulibaly")
        from kalanconnect.teachers.models import TeacherProfile
        TeacherProfile.objects.create(
            user=self.teacher_with_profile,
            bio="Bio",
            hourly_rate=1500,
            neighborhood="Commune III",
        )
        # Professeur sans profil (incomplet)
        self.teacher_no_profile = make_user("+22396003003", role="teacher", first_name="Ami", last_name="Diallo")
        # Utilisateur non-professeur (ne doit pas apparaître)
        self.parent = make_user("+22396003004", role="parent", first_name="Fanta", last_name="Diarra")

    def test_admin_sees_only_incomplete_teachers(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/teachers/incomplete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data]
        self.assertIn(self.teacher_no_profile.id, ids)
        self.assertNotIn(self.teacher_with_profile.id, ids)
        self.assertNotIn(self.parent.id, ids)

    def test_response_contains_expected_fields(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/teachers/incomplete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        item = response.data[0]
        for field in ("id", "first_name", "last_name", "phone", "city", "is_active", "created_at"):
            self.assertIn(field, item)

    def test_non_admin_cannot_access(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.get("/api/v1/admin/teachers/incomplete/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_access(self):
        response = self.client.get("/api/v1/admin/teachers/incomplete/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_when_all_teachers_have_profiles(self):
        from kalanconnect.teachers.models import TeacherProfile
        # Compléter le profil du professeur incomplet
        TeacherProfile.objects.create(
            user=self.teacher_no_profile,
            bio="Nouveau profil",
            hourly_rate=2000,
            neighborhood="Commune V",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/admin/teachers/incomplete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data]
        self.assertNotIn(self.teacher_no_profile.id, ids)
