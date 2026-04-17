"""KalanConnect — URLs racine"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from kalanconnect.accounts.admin_views import (
    AdminBookingsListView,
    AdminDashboardView,
    AdminDeleteReviewView,
    AdminIncompleteTeachersView,
    AdminPendingTeachersView,
    AdminRevenueView,
    AdminReviewsView,
    AdminSubscriptionsView,
    AdminToggleUserActiveView,
    AdminUserDetailView,
    AdminUserListView,
    AdminVerifyTeacherView,
)
from kalanconnect.accounts.views import (
    ChildDetailView,
    ChildListCreateView,
    ChildProgressView,
    StudentProgressView,
    StudentScheduleView,
    StudentTeachersView,
)
from kalanconnect.bookings.views import ReportAdminListView, ReportAdminUpdateView
from kalanconnect.teachers.views import AdminSubjectListCreateView, AdminSubjectDetailView
from kalanconnect.sessions.views import (
    AdminConcoursDetailView,
    AdminConcoursListCreateView,
    ConcoursEventListView,
)
from kalanconnect.chat.views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationUnreadCountView,
    RegisterPushTokenView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("kalanconnect.accounts.urls")),
    path("api/v1/teachers/", include("kalanconnect.teachers.urls")),
    path("api/v1/bookings/", include("kalanconnect.bookings.urls")),
    path("api/v1/chat/", include("kalanconnect.chat.urls")),
    path("api/v1/payments/", include("kalanconnect.payments.urls")),
    path("api/v1/search/", include("kalanconnect.search.urls")),
    path("api/v1/sessions/", include("kalanconnect.sessions.urls")),
    path("api/v1/concours/", ConcoursEventListView.as_view(), name="concours-list"),
    # Notifications
    path("api/v1/notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("api/v1/notifications/<int:pk>/read/", NotificationMarkReadView.as_view(), name="notification-read"),
    path("api/v1/notifications/read-all/", NotificationMarkAllReadView.as_view(), name="notifications-read-all"),
    path("api/v1/notifications/unread-count/", NotificationUnreadCountView.as_view(), name="notifications-unread-count"),
    path("api/v1/notifications/register-push/", RegisterPushTokenView.as_view(), name="notifications-register-push"),
    # Student
    path("api/v1/student/schedule/", StudentScheduleView.as_view(), name="student-schedule"),
    path("api/v1/student/progress/", StudentProgressView.as_view(), name="student-progress"),
    path("api/v1/student/teachers/", StudentTeachersView.as_view(), name="student-teachers"),
    # Children
    path("api/v1/children/", ChildListCreateView.as_view(), name="children-list"),
    path("api/v1/children/<int:pk>/", ChildDetailView.as_view(), name="children-detail"),
    path("api/v1/children/<int:pk>/progress/", ChildProgressView.as_view(), name="children-progress"),
    # Admin — Signalements
    path("api/v1/admin/reports/", ReportAdminListView.as_view(), name="admin-reports"),
    path("api/v1/admin/reports/<int:pk>/", ReportAdminUpdateView.as_view(), name="admin-report-update"),
    # Admin — Dashboard & Management
    path("api/v1/admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("api/v1/admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("api/v1/admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("api/v1/admin/users/<int:pk>/toggle-active/", AdminToggleUserActiveView.as_view(), name="admin-toggle-user"),
    path("api/v1/admin/teachers/pending/", AdminPendingTeachersView.as_view(), name="admin-pending-teachers"),
    path("api/v1/admin/teachers/incomplete/", AdminIncompleteTeachersView.as_view(), name="admin-incomplete-teachers"),
    path("api/v1/admin/teachers/<int:pk>/verify/", AdminVerifyTeacherView.as_view(), name="admin-verify-teacher"),
    path("api/v1/admin/bookings/", AdminBookingsListView.as_view(), name="admin-bookings"),
    path("api/v1/admin/subscriptions/", AdminSubscriptionsView.as_view(), name="admin-subscriptions"),
    path("api/v1/admin/reviews/", AdminReviewsView.as_view(), name="admin-reviews"),
    path("api/v1/admin/reviews/<int:pk>/", AdminDeleteReviewView.as_view(), name="admin-review-delete"),
    path("api/v1/admin/revenue/", AdminRevenueView.as_view(), name="admin-revenue"),
    path("api/v1/admin/concours/", AdminConcoursListCreateView.as_view(), name="admin-concours-list"),
    path("api/v1/admin/concours/<int:pk>/", AdminConcoursDetailView.as_view(), name="admin-concours-detail"),
    path("api/v1/admin/subjects/", AdminSubjectListCreateView.as_view(), name="admin-subjects-list"),
    path("api/v1/admin/subjects/<int:pk>/", AdminSubjectDetailView.as_view(), name="admin-subjects-detail"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
