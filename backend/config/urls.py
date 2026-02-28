"""KalanConnect — URLs racine"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from kalanconnect.bookings.views import ReportAdminListView, ReportAdminUpdateView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("kalanconnect.accounts.urls")),
    path("api/v1/teachers/", include("kalanconnect.teachers.urls")),
    path("api/v1/bookings/", include("kalanconnect.bookings.urls")),
    path("api/v1/chat/", include("kalanconnect.chat.urls")),
    path("api/v1/payments/", include("kalanconnect.payments.urls")),
    path("api/v1/search/", include("kalanconnect.search.urls")),
    # Admin — Signalements
    path("api/v1/admin/reports/", ReportAdminListView.as_view(), name="admin-reports"),
    path("api/v1/admin/reports/<int:pk>/", ReportAdminUpdateView.as_view(), name="admin-report-update"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
