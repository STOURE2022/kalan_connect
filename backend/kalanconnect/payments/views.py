"""
KalanConnect — Views Paiements & Abonnements
"""

import logging
import uuid
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment, Subscription
from .orange_money import OrangeMoneyError, orange_money_service
from .serializers import (
    InitiatePaymentSerializer,
    PaymentSerializer,
    SubscriptionSerializer,
)

logger = logging.getLogger(__name__)


class MySubscriptionView(generics.ListAPIView):
    """GET /api/v1/payments/subscriptions/ — Mes abonnements"""

    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)


class MyPaymentsView(generics.ListAPIView):
    """GET /api/v1/payments/history/ — Historique paiements"""

    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


class InitiatePaymentView(APIView):
    """
    POST /api/v1/payments/initiate/

    Initier un paiement Orange Money pour un abonnement.

    Body:
    {
        "plan": "monthly",
        "phone_number": "+22370000000"
    }
    """

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = serializer.validated_data["plan"]
        plan_config = settings.SUBSCRIPTION_PLANS[plan]

        # Créer l'abonnement en attente
        subscription = Subscription.objects.create(
            user=request.user,
            plan=plan,
            status=Subscription.Status.PENDING,
            auto_renew=(plan != "concours"),
        )

        # Créer le paiement
        idempotency_key = f"{request.user.id}-{plan}-{uuid.uuid4().hex[:8]}"
        payment = Payment.objects.create(
            user=request.user,
            subscription=subscription,
            amount=plan_config["price"],
            provider=Payment.Provider.ORANGE_MONEY,
            idempotency_key=idempotency_key,
            metadata={
                "phone_number": serializer.validated_data["phone_number"],
                "plan": plan,
            },
        )

        # Initier le paiement Orange Money
        try:
            result = orange_money_service.initiate_payment(payment)

            payment.provider_tx_id = result.get("provider_tx_id", "")
            payment.metadata["pay_token"] = result.get("pay_token", "")
            payment.save(update_fields=["provider_tx_id", "metadata"])

            return Response(
                {
                    "payment_id": str(payment.id),
                    "payment_url": result.get("payment_url"),
                    "amount": payment.amount,
                    "currency": payment.currency,
                }
            )

        except OrangeMoneyError as e:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status"])
            subscription.delete()

            return Response(
                {"error": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class OrangeMoneyWebhookView(APIView):
    """
    POST /api/v1/payments/webhook/orange-money/

    Webhook appelé par Orange Money après paiement.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # 1. Vérifier la signature
        signature = request.headers.get("X-Signature", "")
        raw_body = request.body.decode("utf-8")

        if not orange_money_service.verify_webhook_signature(raw_body, signature):
            logger.warning("Webhook Orange Money: signature invalide")
            return Response(
                {"error": "Signature invalide"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Extraire les données
        data = request.data
        order_id = data.get("order_id")
        tx_status = data.get("status")
        provider_tx_id = data.get("txnid", "")

        logger.info(f"Webhook OM: order={order_id}, status={tx_status}")

        # 3. Trouver le paiement
        try:
            payment = Payment.objects.get(id=order_id)
        except Payment.DoesNotExist:
            logger.error(f"Webhook OM: paiement {order_id} introuvable")
            return Response(
                {"error": "Paiement introuvable"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 4. Éviter les doubles traitements (idempotence)
        if payment.status != Payment.Status.PENDING:
            return Response({"status": "already_processed"})

        # 5. Traiter selon le statut
        if tx_status == "SUCCESS":
            payment.status = Payment.Status.SUCCESS
            payment.provider_tx_id = provider_tx_id
            payment.paid_at = timezone.now()
            payment.metadata.update(data)
            payment.save()

            # 6. Activer l'abonnement
            self._activate_subscription(payment)

            logger.info(f"Paiement {order_id} réussi — abonnement activé")

        elif tx_status in ("FAILED", "CANCELLED"):
            payment.status = Payment.Status.FAILED
            payment.metadata.update(data)
            payment.save()

            # Supprimer l'abonnement en attente
            if payment.subscription:
                payment.subscription.delete()

            logger.info(f"Paiement {order_id} échoué: {tx_status}")

        return Response({"status": "processed"})

    def _activate_subscription(self, payment):
        """Activer l'abonnement après paiement réussi"""
        subscription = payment.subscription
        if not subscription:
            return

        plan_config = settings.SUBSCRIPTION_PLANS[subscription.plan]
        now = timezone.now()

        subscription.status = Subscription.Status.ACTIVE
        subscription.start_date = now
        subscription.end_date = now + timedelta(days=plan_config["duration_days"])
        subscription.save()


class MockPaymentView(APIView):
    """
    POST /api/v1/payments/mock-confirm/

    Active un abonnement instantanément sans Orange Money.
    Disponible UNIQUEMENT en mode DEBUG=True.
    """

    def post(self, request):
        if not settings.DEBUG:
            return Response(
                {"error": "Non disponible en production"},
                status=status.HTTP_403_FORBIDDEN,
            )

        plan = request.data.get("plan", "monthly")
        if plan not in ("monthly", "annual", "concours"):
            return Response(
                {"error": "Plan invalide"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan_config = settings.SUBSCRIPTION_PLANS[plan]
        now = timezone.now()

        # Annuler les abonnements pending existants
        Subscription.objects.filter(
            user=request.user,
            status=Subscription.Status.PENDING,
        ).delete()

        # Créer l'abonnement actif directement
        subscription = Subscription.objects.create(
            user=request.user,
            plan=plan,
            status=Subscription.Status.ACTIVE,
            start_date=now,
            end_date=now + timedelta(days=plan_config["duration_days"]),
            auto_renew=(plan != "concours"),
        )

        # Créer le paiement marqué succès
        Payment.objects.create(
            user=request.user,
            subscription=subscription,
            amount=plan_config["price"],
            provider=Payment.Provider.ORANGE_MONEY,
            status=Payment.Status.SUCCESS,
            idempotency_key=f"mock-{request.user.id}-{uuid.uuid4().hex[:8]}",
            paid_at=now,
            metadata={"mock": True, "plan": plan},
        )

        logger.info(f"[MOCK] Abonnement {plan} activé pour {request.user}")

        return Response({
            "status": "success",
            "plan": plan,
            "end_date": subscription.end_date,
        })


class CheckSubscriptionView(APIView):
    """
    GET /api/v1/payments/check-subscription/

    Vérifier si l'utilisateur a un abonnement actif.
    """

    def get(self, request):
        active_sub = Subscription.objects.filter(
            user=request.user,
            status=Subscription.Status.ACTIVE,
            end_date__gt=timezone.now(),
        ).first()

        if active_sub:
            return Response(
                {
                    "has_subscription": True,
                    "plan": active_sub.plan,
                    "end_date": active_sub.end_date,
                }
            )

        return Response({"has_subscription": False})
