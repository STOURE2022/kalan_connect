from django.contrib import admin

from .models import Payment, Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "plan", "status", "start_date", "end_date"]
    list_filter = ["plan", "status"]
    search_fields = ["user__phone", "user__first_name"]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "amount", "provider", "status", "paid_at"]
    list_filter = ["status", "provider"]
    search_fields = ["user__phone", "provider_tx_id"]
    readonly_fields = ["id", "idempotency_key", "metadata"]
