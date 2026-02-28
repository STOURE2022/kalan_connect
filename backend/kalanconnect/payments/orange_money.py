"""
KalanConnect — Service d'intégration Orange Money Mali

Architecture sécurisée :
1. Le client demande un paiement → Backend crée Payment(PENDING)
2. Backend appelle Orange Money API → Reçoit un payment_url
3. Client redirigé vers Orange Money (ou USSD)
4. Orange Money envoie webhook → Backend vérifie signature + active l'abonnement
"""

import hashlib
import hmac
import logging
import uuid

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class OrangeMoneyService:
    """Service de paiement Orange Money Mali"""

    def __init__(self):
        self.merchant_key = settings.ORANGE_MONEY_MERCHANT_KEY
        self.api_url = settings.ORANGE_MONEY_API_URL
        self.return_url = settings.ORANGE_MONEY_RETURN_URL
        self.cancel_url = settings.ORANGE_MONEY_CANCEL_URL
        self.notif_url = settings.ORANGE_MONEY_NOTIF_URL

    def initiate_payment(self, payment):
        """
        Initier un paiement Orange Money.

        Args:
            payment: instance Payment avec amount, currency, user

        Returns:
            dict avec payment_url et provider_tx_id
        """
        order_id = str(payment.id)

        payload = {
            "merchant_key": self.merchant_key,
            "currency": payment.currency,
            "order_id": order_id,
            "amount": payment.amount,
            "return_url": self.return_url,
            "cancel_url": self.cancel_url,
            "notif_url": self.notif_url,
            "lang": "fr",
            "reference": f"KALAN-{order_id[:8]}",
        }

        try:
            response = requests.post(
                f"{self.api_url}/webpayment",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self._get_access_token()}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            return {
                "payment_url": data.get("payment_url"),
                "pay_token": data.get("pay_token"),
                "provider_tx_id": data.get("txnid", ""),
            }

        except requests.RequestException as e:
            logger.error(f"Erreur Orange Money initiate: {e}")
            raise OrangeMoneyError(f"Erreur lors de l'initiation du paiement: {e}")

    def verify_webhook_signature(self, payload, signature):
        """
        Vérifier la signature HMAC du webhook Orange Money.

        Args:
            payload: corps brut de la requête
            signature: signature reçue dans le header

        Returns:
            bool
        """
        expected = hmac.new(
            self.merchant_key.encode(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected, signature)

    def check_transaction_status(self, pay_token):
        """
        Vérifier le statut d'une transaction (réconciliation).

        Args:
            pay_token: token de paiement Orange Money

        Returns:
            dict avec status et transaction details
        """
        try:
            response = requests.get(
                f"{self.api_url}/transactionstatus",
                params={
                    "pay_token": pay_token,
                    "merchant_key": self.merchant_key,
                },
                headers={
                    "Authorization": f"Bearer {self._get_access_token()}",
                },
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            logger.error(f"Erreur vérification statut: {e}")
            raise OrangeMoneyError(f"Erreur de vérification: {e}")

    def _get_access_token(self):
        """Obtenir un token d'accès OAuth2 Orange API"""
        # En production, implémenter le cache du token
        # avec expiration (utiliser Redis)
        from django.core.cache import cache

        token = cache.get("orange_money_access_token")
        if token:
            return token

        response = requests.post(
            "https://api.orange.com/oauth/v3/token",
            data={
                "grant_type": "client_credentials",
            },
            headers={
                "Authorization": f"Basic {self.merchant_key}",
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        token = data["access_token"]
        expires_in = data.get("expires_in", 3600)
        cache.set("orange_money_access_token", token, expires_in - 60)

        return token


class OrangeMoneyError(Exception):
    """Exception Orange Money"""

    pass


# Singleton
orange_money_service = OrangeMoneyService()
