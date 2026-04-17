from django.contrib import admin
from .models import ConcoursEvent, GroupSession, SessionRegistration


@admin.register(ConcoursEvent)
class ConcoursEventAdmin(admin.ModelAdmin):
    list_display  = ["type", "title", "year", "date_inscription_limite", "date_examen", "is_active"]
    list_filter   = ["type", "is_active", "year"]
    list_editable = ["is_active"]
    search_fields = ["title"]
    ordering      = ["date_examen"]


@admin.register(GroupSession)
class GroupSessionAdmin(admin.ModelAdmin):
    list_display = ["title", "teacher", "subject", "date", "status"]
    list_filter  = ["status", "location_type"]


@admin.register(SessionRegistration)
class SessionRegistrationAdmin(admin.ModelAdmin):
    list_display = ["session", "user", "status", "created_at"]
    list_filter  = ["status"]
