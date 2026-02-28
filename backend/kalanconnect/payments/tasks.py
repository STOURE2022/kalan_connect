"""
KalanConnect — Tâches Celery pour les paiements
"""

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def check_expired_subscriptions():
    """
    Tâche planifiée : vérifier et expirer les abonnements arrivés à terme.
    Exécutée toutes les heures via Celery Beat.
    """
    from .models import Subscription

    expired = Subscription.objects.filter(
        status=Subscription.Status.ACTIVE,
        end_date__lt=timezone.now(),
    )
    count = expired.update(status=Subscription.Status.EXPIRED)
    logger.info(f"{count} abonnements expirés")


@shared_task
def reconcile_pending_payments():
    """
    Tâche planifiée : réconcilier les paiements en attente depuis + de 30 min.
    Vérifie le statut côté Orange Money.
    """
    from .models import Payment
    from .orange_money import orange_money_service

    cutoff = timezone.now() - timezone.timedelta(minutes=30)
    pending = Payment.objects.filter(
        status=Payment.Status.PENDING,
        created_at__lt=cutoff,
    )

    for payment in pending:
        pay_token = payment.metadata.get("pay_token")
        if not pay_token:
            continue

        try:
            result = orange_money_service.check_transaction_status(pay_token)
            tx_status = result.get("status")

            if tx_status == "SUCCESS":
                payment.status = Payment.Status.SUCCESS
                payment.paid_at = timezone.now()
                payment.save()
                logger.info(f"Réconciliation: paiement {payment.id} réussi")
            elif tx_status in ("FAILED", "EXPIRED"):
                payment.status = Payment.Status.FAILED
                payment.save()
                if payment.subscription:
                    payment.subscription.delete()
                logger.info(f"Réconciliation: paiement {payment.id} échoué")

        except Exception as e:
            logger.error(f"Erreur réconciliation {payment.id}: {e}")


@shared_task
def send_subscription_expiry_reminder():
    """
    Rappel 3 jours avant expiration de l'abonnement.
    """
    from .models import Subscription

    in_3_days = timezone.now() + timezone.timedelta(days=3)
    expiring = Subscription.objects.filter(
        status=Subscription.Status.ACTIVE,
        end_date__date=in_3_days.date(),
    ).select_related("user")

    for sub in expiring:
        # TODO: Envoyer notification push + SMS
        logger.info(
            f"Rappel expiration: {sub.user.phone} — "
            f"expire le {sub.end_date}"
        )
