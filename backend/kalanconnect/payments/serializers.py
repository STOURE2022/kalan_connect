"""
KalanConnect — Serializers Paiements & Abonnements
"""

from rest_framework import serializers

from .models import Payment, Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    price = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan",
            "status",
            "price",
            "start_date",
            "end_date",
            "auto_renew",
            "created_at",
        ]
        read_only_fields = ["id", "status", "start_date", "end_date", "created_at"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "amount",
            "currency",
            "provider",
            "status",
            "paid_at",
            "created_at",
        ]


class InitiatePaymentSerializer(serializers.Serializer):
    """Demande d'initiation de paiement"""

    plan = serializers.ChoiceField(choices=Subscription.Plan.choices)
    phone_number = serializers.CharField(
        max_length=20,
        help_text="Numéro Orange Money (ex: +22370000000)",
    )
