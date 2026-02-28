from django.urls import path

from . import views

app_name = "payments"

urlpatterns = [
    path("subscriptions/", views.MySubscriptionView.as_view(), name="subscriptions"),
    path("history/", views.MyPaymentsView.as_view(), name="history"),
    path("initiate/", views.InitiatePaymentView.as_view(), name="initiate"),
    path("check-subscription/", views.CheckSubscriptionView.as_view(), name="check"),
    # Webhook Orange Money (public, vérifié par signature)
    path(
        "webhook/orange-money/",
        views.OrangeMoneyWebhookView.as_view(),
        name="webhook-om",
    ),
]
