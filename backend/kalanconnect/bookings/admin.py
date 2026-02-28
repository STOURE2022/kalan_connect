from django.contrib import admin

from .models import Booking, BookingPack, Report, Review


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["id", "parent", "teacher", "subject", "date", "status", "price"]
    list_filter = ["status", "location_type", "date"]
    search_fields = ["parent__first_name", "teacher__user__first_name"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["parent", "teacher", "rating", "created_at"]
    list_filter = ["rating"]


@admin.register(BookingPack)
class BookingPackAdmin(admin.ModelAdmin):
    list_display = ["id", "buyer", "teacher", "pack_type", "used_sessions", "total_sessions", "status", "created_at"]
    list_filter = ["pack_type", "status"]
    search_fields = ["buyer__first_name", "buyer__last_name", "teacher__user__first_name"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["id", "reporter", "reported_user", "reason", "status", "created_at"]
    list_filter = ["reason", "status"]
    search_fields = ["reporter__first_name", "reported_user__first_name"]
