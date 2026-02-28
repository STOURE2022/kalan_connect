from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["phone", "first_name", "last_name", "role", "is_active", "created_at"]
    list_filter = ["role", "is_active", "is_phone_verified", "city"]
    search_fields = ["phone", "first_name", "last_name", "email"]
    ordering = ["-created_at"]

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Infos", {"fields": ("first_name", "last_name", "email", "avatar")}),
        ("Rôle", {"fields": ("role", "city", "neighborhood")}),
        ("Statut", {"fields": ("is_active", "is_phone_verified", "is_staff", "is_superuser")}),
        ("Notifications", {"fields": ("fcm_token",)}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("phone", "password1", "password2", "role")}),
    )
