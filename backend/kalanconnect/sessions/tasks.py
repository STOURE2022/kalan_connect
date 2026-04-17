"""
KalanConnect — Tâches Celery pour les concours et sessions de groupe
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def mark_completed_sessions():
    """
    Marque automatiquement comme 'completed' les sessions de groupe
    dont la date+heure de fin est passée et qui sont encore open/full.
    Planifiée toutes les heures via Celery Beat.
    """
    import datetime
    from django.utils import timezone
    from .models import GroupSession

    now = timezone.now()
    today = now.date()
    current_time = now.time()

    # Sessions dont la date est strictement passée
    past_date = GroupSession.objects.filter(
        date__lt=today,
        status__in=[GroupSession.Status.OPEN, GroupSession.Status.FULL],
    )

    # Sessions d'aujourd'hui dont l'heure de fin est passée
    past_today = GroupSession.objects.filter(
        date=today,
        end_time__lt=current_time,
        status__in=[GroupSession.Status.OPEN, GroupSession.Status.FULL],
    )

    total = past_date.update(status=GroupSession.Status.COMPLETED) \
          + past_today.update(status=GroupSession.Status.COMPLETED)

    if total:
        logger.info(f"mark_completed_sessions: {total} session(s) marquée(s) completed")
    return total


@shared_task
def send_concours_alerts():
    """
    Envoie des alertes J-7 et J-1 aux abonnés concours pour :
      - la date limite d'inscription à un concours
      - la date de l'examen

    Planifiée quotidiennement à 08h00 (Africa/Bamako) via Celery Beat.
    """
    from django.utils import timezone
    from kalanconnect.chat.models import AppNotification
    from kalanconnect.payments.models import Subscription
    from .models import ConcoursEvent

    today = timezone.now().date()

    # Utilisateurs avec abonnement concours actif
    user_ids = list(
        Subscription.objects.filter(
            status=Subscription.Status.ACTIVE,
            plan="concours",
        ).values_list("user_id", flat=True).distinct()
    )

    if not user_ids:
        logger.info("send_concours_alerts: aucun abonné concours actif")
        return

    notifications = []

    for days in (7, 1):
        target_date = today + timezone.timedelta(days=days)
        plural = "s" if days > 1 else ""
        date_str = target_date.strftime("%d/%m/%Y")

        # ── Deadline d'inscription ──────────────────────────────
        for event in ConcoursEvent.objects.filter(
            is_active=True,
            date_inscription_limite=target_date,
        ):
            title   = f"📅 {event.type} {event.year} — J-{days} inscriptions"
            message = (
                f"La date limite d'inscription au {event.title} est dans "
                f"{days} jour{plural} ({date_str}). Ne tardez pas !"
            )
            data = {
                "concours_event_id": event.id,
                "alert_type": "inscription",
                "days": days,
            }
            for uid in user_ids:
                notifications.append(AppNotification(
                    user_id=uid,
                    title=title,
                    message=message,
                    type=AppNotification.NotificationType.SYSTEM,
                    data=data,
                ))

        # ── Date d'examen ────────────────────────────────────────
        for event in ConcoursEvent.objects.filter(
            is_active=True,
            date_examen=target_date,
        ):
            title   = f"🎓 {event.type} {event.year} — J-{days} examen"
            message = (
                f"L'examen {event.title} a lieu dans {days} jour{plural} "
                f"({date_str}). Bon courage !"
            )
            data = {
                "concours_event_id": event.id,
                "alert_type": "examen",
                "days": days,
            }
            for uid in user_ids:
                notifications.append(AppNotification(
                    user_id=uid,
                    title=title,
                    message=message,
                    type=AppNotification.NotificationType.SYSTEM,
                    data=data,
                ))

    if notifications:
        AppNotification.objects.bulk_create(notifications)
        logger.info(f"send_concours_alerts: {len(notifications)} notifications créées")
    else:
        logger.info("send_concours_alerts: aucune échéance aujourd'hui")
