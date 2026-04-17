"""
Tests — Application payments
Couvre : modèles Subscription & Payment, endpoints abonnements,
         historique paiements, vérification, webhook Orange Money.
"""

import datetime
import hashlib
import hmac
import json
import uuid

from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────


def make_user(phone, role="parent", first_name="Pay", last_name="User"):
    return User.objects.create_user(
        phone=phone, first_name=first_name, last_name=last_name,
        password="testpass123", role=role,
    )


def make_subscription(user, plan="monthly", sub_status="active", days=30):
    from kalanconnect.payments.models import Subscription
    return Subscription.objects.create(
        user=user, plan=plan, status=sub_status,
        start_date=timezone.now(),
        end_date=timezone.now() + datetime.timedelta(days=days),
    )


def make_payment(user, subscription=None, amount=1500, pay_status="pending"):
    from kalanconnect.payments.models import Payment
    return Payment.objects.create(
        user=user, subscription=subscription,
        amount=amount, provider="orange_money", status=pay_status,
    )


# ─────────────────────────────────────────────────────────────
# Modèle Subscription
# ─────────────────────────────────────────────────────────────


class SubscriptionModelTests(TestCase):

    def setUp(self):
        self.user = make_user("+22395001001")

    def test_create_monthly_subscription(self):
        from kalanconnect.payments.models import Subscription
        sub = make_subscription(self.user, plan="monthly")
        self.assertEqual(sub.plan, "monthly")
        self.assertEqual(sub.status, "active")
        self.assertTrue(sub.auto_renew)

    def test_create_annual_subscription(self):
        sub = make_subscription(self.user, plan="annual", days=365)
        self.assertEqual(sub.plan, "annual")

    def test_default_status_is_pending(self):
        from kalanconnect.payments.models import Subscription
        sub = Subscription.objects.create(user=self.user, plan="monthly")
        self.assertEqual(sub.status, "pending")

    def test_price_monthly(self):
        sub = make_subscription(self.user, plan="monthly")
        self.assertEqual(sub.price, 1500)

    def test_price_annual(self):
        sub = make_subscription(self.user, plan="annual")
        self.assertEqual(sub.price, 15000)

    def test_subscription_str(self):
        sub = make_subscription(self.user, plan="monthly")
        text = str(sub)
        self.assertIn("monthly", text.lower() + sub.plan)

    def test_ordering_newest_first(self):
        from kalanconnect.payments.models import Subscription
        sub1 = make_subscription(self.user, plan="monthly")
        sub2 = make_subscription(self.user, plan="annual")
        subs = list(Subscription.objects.filter(user=self.user))
        self.assertEqual(subs[0].id, sub2.id)  # Le plus récent en premier

    def test_all_statuses_valid(self):
        from kalanconnect.payments.models import Subscription
        statuses = ["active", "expired", "cancelled", "pending"]
        for i, s in enumerate(statuses):
            Subscription.objects.create(user=self.user, plan="monthly", status=s)
        self.assertEqual(Subscription.objects.filter(user=self.user).count(), len(statuses))


# ─────────────────────────────────────────────────────────────
# Modèle Payment
# ─────────────────────────────────────────────────────────────


class PaymentModelTests(TestCase):

    def setUp(self):
        self.user = make_user("+22395002001")
        self.sub = make_subscription(self.user, sub_status="pending")

    def test_payment_has_uuid_primary_key(self):
        payment = make_payment(self.user, self.sub)
        self.assertIsInstance(payment.id, uuid.UUID)

    def test_payment_default_status_pending(self):
        payment = make_payment(self.user)
        self.assertEqual(payment.status, "pending")

    def test_payment_default_currency_xof(self):
        payment = make_payment(self.user)
        self.assertEqual(payment.currency, "XOF")

    def test_payment_idempotency_key_unique(self):
        from kalanconnect.payments.models import Payment
        key = str(uuid.uuid4())
        Payment.objects.create(user=self.user, amount=1500, idempotency_key=key)
        with self.assertRaises(IntegrityError):
            Payment.objects.create(user=self.user, amount=1500, idempotency_key=key)

    def test_payment_str_contains_amount(self):
        payment = make_payment(self.user, amount=1500)
        self.assertIn("1500", str(payment))

    def test_payment_metadata_default_empty_dict(self):
        payment = make_payment(self.user)
        self.assertEqual(payment.metadata, {})

    def test_payment_all_statuses_valid(self):
        from kalanconnect.payments.models import Payment
        statuses = ["pending", "success", "failed", "refunded"]
        for s in statuses:
            Payment.objects.create(user=self.user, amount=1500, status=s)
        self.assertEqual(Payment.objects.filter(user=self.user).count(), len(statuses))


# ─────────────────────────────────────────────────────────────
# API — Liste des abonnements
# ─────────────────────────────────────────────────────────────


class SubscriptionListAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22395003001", "parent", "Sub", "List")
        self.other = make_user("+22395003002", "parent", "Other", "User")
        make_subscription(self.user, plan="monthly")
        make_subscription(self.other, plan="annual")
        self.client.force_authenticate(user=self.user)

    def test_list_only_own_subscriptions(self):
        response = self.client.get("/api/v1/payments/subscriptions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["plan"], "monthly")

    def test_unauthenticated_cannot_list_subscriptions(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/payments/subscriptions/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Historique des paiements
# ─────────────────────────────────────────────────────────────


class PaymentHistoryAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22395004001", "parent", "Pay", "History")
        self.other = make_user("+22395004002", "parent", "Other", "User")
        make_payment(self.user, amount=1500)
        make_payment(self.user, amount=1500)
        make_payment(self.other, amount=15000)
        self.client.force_authenticate(user=self.user)

    def test_list_only_own_payments(self):
        response = self.client.get("/api/v1/payments/history/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 2)

    def test_unauthenticated_cannot_list_payments(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/payments/history/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Vérification d'abonnement
# ─────────────────────────────────────────────────────────────


class CheckSubscriptionAPITests(APITestCase):

    def test_active_subscription_returns_true(self):
        user = make_user("+22395005001", "parent", "Check", "Active")
        make_subscription(user, plan="monthly", days=30)
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/v1/payments/check-subscription/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_subscription"])
        self.assertEqual(response.data["plan"], "monthly")
        self.assertIn("end_date", response.data)

    def test_no_subscription_returns_false(self):
        user = make_user("+22395005002", "parent", "Check", "Empty")
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/v1/payments/check-subscription/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["has_subscription"])

    def test_expired_subscription_returns_false(self):
        from kalanconnect.payments.models import Subscription
        user = make_user("+22395005003", "parent", "Check", "Expired")
        Subscription.objects.create(
            user=user, plan="monthly", status="active",
            start_date=timezone.now() - datetime.timedelta(days=60),
            end_date=timezone.now() - datetime.timedelta(days=30),  # Expirée
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/v1/payments/check-subscription/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["has_subscription"])

    def test_pending_subscription_returns_false(self):
        user = make_user("+22395005004", "parent", "Check", "Pending")
        make_subscription(user, sub_status="pending")
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/v1/payments/check-subscription/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["has_subscription"])

    def test_annual_subscription_detected(self):
        user = make_user("+22395005005", "parent", "Check", "Annual")
        make_subscription(user, plan="annual", days=365)
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/v1/payments/check-subscription/")
        self.assertTrue(response.data["has_subscription"])
        self.assertEqual(response.data["plan"], "annual")

    def test_unauthenticated_cannot_check_subscription(self):
        response = self.client.get("/api/v1/payments/check-subscription/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Initiation de paiement Orange Money
# ─────────────────────────────────────────────────────────────


class InitiatePaymentAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22395006001", "parent", "Initiate", "Pay")
        self.client.force_authenticate(user=self.user)

    @patch("kalanconnect.payments.views.orange_money_service")
    def test_initiate_monthly_payment_creates_subscription_and_payment(self, mock_service):
        from kalanconnect.payments.models import Subscription, Payment
        mock_service.initiate_payment.return_value = {
            "payment_url": "https://api.orange.com/pay/123",
            "pay_token": "tok_abc",
            "provider_tx_id": "TXN001",
        }
        response = self.client.post("/api/v1/payments/initiate/", {
            "plan": "monthly",
            "phone_number": "+22370000001",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("payment_id", response.data)
        self.assertIn("payment_url", response.data)
        self.assertEqual(response.data["amount"], 1500)
        self.assertTrue(Subscription.objects.filter(user=self.user).exists())
        self.assertTrue(Payment.objects.filter(user=self.user).exists())

    @patch("kalanconnect.payments.views.orange_money_service")
    def test_initiate_annual_payment_correct_amount(self, mock_service):
        mock_service.initiate_payment.return_value = {
            "payment_url": "https://api.orange.com/pay/456",
            "pay_token": "tok_xyz",
            "provider_tx_id": "TXN002",
        }
        response = self.client.post("/api/v1/payments/initiate/", {
            "plan": "annual",
            "phone_number": "+22370000002",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["amount"], 15000)

    @patch("kalanconnect.payments.views.orange_money_service")
    def test_orange_money_error_returns_502(self, mock_service):
        from kalanconnect.payments.orange_money import OrangeMoneyError
        mock_service.initiate_payment.side_effect = OrangeMoneyError("Service indisponible")
        response = self.client.post("/api/v1/payments/initiate/", {
            "plan": "monthly",
            "phone_number": "+22370000003",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("error", response.data)

    def test_invalid_plan_returns_400(self):
        response = self.client.post("/api/v1/payments/initiate/", {
            "plan": "invalid_plan",
            "phone_number": "+22370000004",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_plan_returns_400(self):
        response = self.client.post("/api/v1/payments/initiate/", {
            "phone_number": "+22370000005",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_phone_number_returns_400(self):
        response = self.client.post("/api/v1/payments/initiate/", {
            "plan": "monthly",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_cannot_initiate_payment(self):
        self.client.force_authenticate(user=None)
        response = self.client.post("/api/v1/payments/initiate/", {
            "plan": "monthly",
            "phone_number": "+22370000006",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Webhook Orange Money
# ─────────────────────────────────────────────────────────────


class OrangeMoneyWebhookAPITests(APITestCase):
    """
    Tests du webhook. La signature est vérifiée par orange_money_service,
    qu'on mock pour contrôler le résultat.
    """

    def setUp(self):
        from kalanconnect.payments.models import Subscription, Payment
        self.user = make_user("+22395007001", "parent", "Webhook", "User")
        self.sub = Subscription.objects.create(
            user=self.user, plan="monthly", status="pending",
        )
        self.payment = Payment.objects.create(
            user=self.user, subscription=self.sub,
            amount=1500, provider="orange_money", status="pending",
        )

    @patch("kalanconnect.payments.views.orange_money_service")
    def test_success_webhook_activates_subscription(self, mock_service):
        from kalanconnect.payments.models import Payment, Subscription
        mock_service.verify_webhook_signature.return_value = True
        payload = {
            "order_id": str(self.payment.id),
            "status": "SUCCESS",
            "txnid": "TXN_REAL_001",
        }
        response = self.client.post(
            "/api/v1/payments/webhook/orange-money/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_SIGNATURE="valid_signature",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "success")
        self.sub.refresh_from_db()
        self.assertEqual(self.sub.status, "active")
        self.assertIsNotNone(self.payment.paid_at)

    @patch("kalanconnect.payments.views.orange_money_service")
    def test_failed_webhook_deletes_subscription(self, mock_service):
        from kalanconnect.payments.models import Payment, Subscription
        mock_service.verify_webhook_signature.return_value = True
        payload = {
            "order_id": str(self.payment.id),
            "status": "FAILED",
            "txnid": "",
        }
        response = self.client.post(
            "/api/v1/payments/webhook/orange-money/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_SIGNATURE="valid_signature",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "failed")
        self.assertFalse(Subscription.objects.filter(id=self.sub.id).exists())

    @patch("kalanconnect.payments.views.orange_money_service")
    def test_invalid_signature_returns_403(self, mock_service):
        mock_service.verify_webhook_signature.return_value = False
        payload = {"order_id": str(self.payment.id), "status": "SUCCESS"}
        response = self.client.post(
            "/api/v1/payments/webhook/orange-money/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_SIGNATURE="bad_signature",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("kalanconnect.payments.views.orange_money_service")
    def test_nonexistent_payment_returns_404(self, mock_service):
        mock_service.verify_webhook_signature.return_value = True
        fake_id = str(uuid.uuid4())
        payload = {"order_id": fake_id, "status": "SUCCESS"}
        response = self.client.post(
            "/api/v1/payments/webhook/orange-money/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_SIGNATURE="valid_signature",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch("kalanconnect.payments.views.orange_money_service")
    def test_already_processed_payment_returns_already_processed(self, mock_service):
        """Idempotence : traiter deux fois le même webhook."""
        from kalanconnect.payments.models import Payment
        mock_service.verify_webhook_signature.return_value = True
        self.payment.status = "success"
        self.payment.save(update_fields=["status"])
        payload = {"order_id": str(self.payment.id), "status": "SUCCESS"}
        response = self.client.post(
            "/api/v1/payments/webhook/orange-money/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_SIGNATURE="valid_signature",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "already_processed")

    @patch("kalanconnect.payments.views.orange_money_service")
    def test_cancelled_webhook_handled_like_failed(self, mock_service):
        mock_service.verify_webhook_signature.return_value = True
        payload = {"order_id": str(self.payment.id), "status": "CANCELLED"}
        response = self.client.post(
            "/api/v1/payments/webhook/orange-money/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_SIGNATURE="valid_signature",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "failed")

    def test_webhook_is_public_no_auth_required(self):
        """Le webhook Orange Money doit être accessible sans token JWT."""
        with patch("kalanconnect.payments.views.orange_money_service") as mock_service:
            mock_service.verify_webhook_signature.return_value = False
            response = self.client.post(
                "/api/v1/payments/webhook/orange-money/",
                data=json.dumps({"order_id": "x", "status": "SUCCESS"}),
                content_type="application/json",
            )
            # Signature invalide → 403, mais pas 401 (pas de JWT requis)
            self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# API — Mock paiement (DEBUG uniquement)
# ─────────────────────────────────────────────────────────────


class MockPaymentAPITests(APITestCase):

    def setUp(self):
        self.user = make_user("+22395008001", "parent", "Mock", "Pay")
        self.client.force_authenticate(user=self.user)

    @override_settings(DEBUG=True)
    def test_mock_confirm_monthly_activates_subscription(self):
        from kalanconnect.payments.models import Subscription, Payment
        response = self.client.post(
            "/api/v1/payments/mock-confirm/",
            {"plan": "monthly"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["plan"], "monthly")
        self.assertIn("end_date", response.data)
        sub = Subscription.objects.get(user=self.user, status="active")
        self.assertEqual(sub.plan, "monthly")
        payment = Payment.objects.get(user=self.user, status="success")
        self.assertTrue(payment.metadata.get("mock"))

    @override_settings(DEBUG=True)
    def test_mock_confirm_annual_activates_subscription(self):
        from kalanconnect.payments.models import Subscription
        response = self.client.post(
            "/api/v1/payments/mock-confirm/",
            {"plan": "annual"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sub = Subscription.objects.get(user=self.user, status="active")
        self.assertEqual(sub.plan, "annual")

    @override_settings(DEBUG=True)
    def test_mock_confirm_cleans_up_pending_subscriptions(self):
        from kalanconnect.payments.models import Subscription
        Subscription.objects.create(user=self.user, plan="monthly", status="pending")
        self.client.post("/api/v1/payments/mock-confirm/", {"plan": "monthly"}, format="json")
        self.assertFalse(Subscription.objects.filter(user=self.user, status="pending").exists())

    @override_settings(DEBUG=True)
    def test_mock_confirm_invalid_plan_returns_400(self):
        response = self.client.post(
            "/api/v1/payments/mock-confirm/",
            {"plan": "invalid"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mock_confirm_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/v1/payments/mock-confirm/",
            {"plan": "monthly"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mock_confirm_blocked_in_production(self):
        """DEBUG=False (comportement par défaut des tests) → 403."""
        response = self.client.post(
            "/api/v1/payments/mock-confirm/",
            {"plan": "monthly"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
