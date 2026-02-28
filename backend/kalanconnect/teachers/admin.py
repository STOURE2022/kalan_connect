from django.contrib import admin

from .models import Availability, Diploma, Level, Subject, TeacherProfile, TeacherSubject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "is_active"]
    list_filter = ["category", "is_active"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ["name", "order"]
    ordering = ["order"]
    prepopulated_fields = {"slug": ("name",)}


class TeacherSubjectInline(admin.TabularInline):
    model = TeacherSubject
    extra = 1


class DiplomaInline(admin.TabularInline):
    model = Diploma
    extra = 0


class AvailabilityInline(admin.TabularInline):
    model = Availability
    extra = 0


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = [
        "user", "city", "neighborhood", "hourly_rate",
        "avg_rating", "is_verified", "is_featured",
    ]
    list_filter = ["city", "is_verified", "is_featured"]
    search_fields = ["user__first_name", "user__last_name", "neighborhood"]
    inlines = [TeacherSubjectInline, DiplomaInline, AvailabilityInline]
