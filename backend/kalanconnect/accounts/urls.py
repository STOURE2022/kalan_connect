from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

app_name = "accounts"

urlpatterns = [
    # Auth JWT
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # Inscription & Profil
    path("register/", views.RegisterView.as_view(), name="register"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("verify-phone/", views.VerifyPhoneView.as_view(), name="verify-phone"),
    # Children
    path("children/", views.ChildListCreateView.as_view(), name="children-list"),
    path("children/<int:pk>/", views.ChildDetailView.as_view(), name="children-detail"),
    path("children/<int:pk>/progress/", views.ChildProgressView.as_view(), name="children-progress"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("account/", views.DeleteAccountView.as_view(), name="delete-account"),
]
