from django.contrib import admin

from .models import Booking, Review


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["id", "parent", "teacher", "subject", "date", "status", "price"]
    list_filter = ["status", "location_type", "date"]
    search_fields = ["parent__first_name", "teacher__user__first_name"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["parent", "teacher", "rating", "created_at"]
    list_filter = ["rating"]
