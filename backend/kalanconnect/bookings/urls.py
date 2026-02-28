from django.urls import path

from . import views

app_name = "bookings"

urlpatterns = [
    path("", views.BookingListView.as_view(), name="list"),
    path("create/", views.BookingCreateView.as_view(), name="create"),
    path("<int:pk>/", views.BookingDetailView.as_view(), name="detail"),
    path("<int:pk>/<str:action>/", views.booking_action, name="action"),
    # Avis
    path("reviews/", views.ReviewCreateView.as_view(), name="review-create"),
    path(
        "reviews/<int:teacher_id>/",
        views.ReviewListView.as_view(),
        name="review-list",
    ),
    # Packs de cours
    path("packs/", views.BookingPackListView.as_view(), name="pack-list"),
    path("packs/create/", views.BookingPackCreateView.as_view(), name="pack-create"),
    # Signalements
    path("reports/", views.ReportCreateView.as_view(), name="report-create"),
]
