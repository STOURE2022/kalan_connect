"""
KalanConnect — Comprehensive API Endpoint Test Script
Tests all 60+ endpoints across all roles.
Uses Django's test client (no need for runserver).
"""

import os
import sys
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.test.client import Client
from django.contrib.auth import get_user_model

User = get_user_model()

client = Client()

# ── Counters ──
passed = 0
failed = 0
errors = []


def test(name, method, url, expected_status, token=None, data=None, expected_in=None):
    """Run a single API test."""
    global passed, failed, errors
    headers = {}
    if token:
        headers["HTTP_AUTHORIZATION"] = f"Bearer {token}"

    try:
        if method == "GET":
            resp = client.get(url, **headers)
        elif method == "POST":
            resp = client.post(url, data=json.dumps(data or {}), content_type="application/json", **headers)
        elif method == "PATCH":
            resp = client.patch(url, data=json.dumps(data or {}), content_type="application/json", **headers)
        elif method == "PUT":
            resp = client.put(url, data=json.dumps(data or {}), content_type="application/json", **headers)
        elif method == "DELETE":
            resp = client.delete(url, **headers)
        else:
            print(f"  [?] {name} — Unknown method {method}")
            return None

        status_ok = resp.status_code == expected_status
        body = resp.content.decode("utf-8", errors="replace")

        content_ok = True
        if expected_in and status_ok:
            content_ok = expected_in in body

        if status_ok and content_ok:
            passed += 1
            print(f"  [OK] {name} — {resp.status_code}")
        else:
            failed += 1
            detail = body[:200] if len(body) > 200 else body
            msg = f"  [FAIL] {name} — got {resp.status_code} (expected {expected_status})"
            if not content_ok:
                msg += f" | missing '{expected_in}'"
            msg += f" | {detail}"
            print(msg)
            errors.append(msg)

        return resp
    except Exception as e:
        failed += 1
        msg = f"  [ERROR] {name} — {type(e).__name__}: {e}"
        print(msg)
        errors.append(msg)
        return None


def get_token(phone, password="Test1234"):
    """Get JWT access token for a user."""
    resp = client.post(
        "/api/v1/auth/login/",
        data=json.dumps({"phone": phone, "password": password}),
        content_type="application/json",
    )
    if resp.status_code == 200:
        data = resp.json()
        return data.get("access")
    return None


def register_user(phone, first_name, last_name, role, password="Test1234"):
    """Register a new user and return the access token."""
    resp = client.post(
        "/api/v1/auth/register/",
        data=json.dumps({
            "phone": phone,
            "first_name": first_name,
            "last_name": last_name,
            "role": role,
            "password": password,
            "password_confirm": password,
            "city": "Bamako",
            "neighborhood": "Hamdallaye",
        }),
        content_type="application/json",
    )
    if resp.status_code == 201:
        data = resp.json()
        return data["tokens"]["access"]
    else:
        print(f"  [WARN] Register {phone} failed: {resp.status_code} — {resp.content.decode()[:200]}")
        # Try login instead
        return get_token(phone, password)


# ══════════════════════════════════════
# SEED DATA
# ══════════════════════════════════════
print("=" * 60)
print("SEEDING TEST DATA")
print("=" * 60)

# Create subjects and levels first
from kalanconnect.teachers.models import Subject, Level, TeacherProfile, TeacherSubject, Availability, Diploma
from kalanconnect.bookings.models import Booking, Review, BookingPack, Report
from kalanconnect.chat.models import Conversation, Message, AppNotification
from kalanconnect.payments.models import Subscription, Payment
from datetime import date, time, timedelta
from django.utils import timezone

# Subjects
math_subj, _ = Subject.objects.get_or_create(
    slug="mathematiques",
    defaults={"name": "Mathématiques", "icon": "calculator", "category": "Sciences", "is_active": True}
)
french_subj, _ = Subject.objects.get_or_create(
    slug="francais",
    defaults={"name": "Français", "icon": "book", "category": "Langues", "is_active": True}
)

# Levels
level_college, _ = Level.objects.get_or_create(
    slug="college",
    defaults={"name": "Collège", "order": 2}
)
level_lycee, _ = Level.objects.get_or_create(
    slug="lycee",
    defaults={"name": "Lycée", "order": 3}
)

print("  Subjects & Levels created")

# Register users
parent_token = register_user("+22370000001", "Amadou", "Diallo", "parent")
teacher_token = register_user("+22370000002", "Fatoumata", "Keita", "teacher")
admin_token = register_user("+22370000003", "Moussa", "Traore", "admin")
student_token = register_user("+22370000004", "Awa", "Coulibaly", "student")
etudiant_token = register_user("+22370000005", "Ibrahim", "Sangare", "etudiant")

print(f"  Parent token: {'OK' if parent_token else 'FAIL'}")
print(f"  Teacher token: {'OK' if teacher_token else 'FAIL'}")
print(f"  Admin token: {'OK' if admin_token else 'FAIL'}")
print(f"  Student token: {'OK' if student_token else 'FAIL'}")
print(f"  Etudiant token: {'OK' if etudiant_token else 'FAIL'}")

# Create teacher profile
teacher_user = User.objects.get(phone="+22370000002")
teacher_profile, _ = TeacherProfile.objects.get_or_create(
    user=teacher_user,
    defaults={
        "bio": "Prof de maths expérimenté",
        "hourly_rate": 5000,
        "city": "Bamako",
        "neighborhood": "Hamdallaye",
        "experience_years": 5,
        "teaches_online": True,
        "teaches_at_home": True,
        "teaches_at_student": True,
        "radius_km": 10,
        "is_verified": False,
    }
)

# Add subjects to teacher
TeacherSubject.objects.get_or_create(
    teacher=teacher_profile, subject=math_subj, level=level_college
)
TeacherSubject.objects.get_or_create(
    teacher=teacher_profile, subject=french_subj, level=level_lycee
)

# Add diploma
diploma, _ = Diploma.objects.get_or_create(
    teacher=teacher_profile,
    title="Licence Mathématiques",
    defaults={"institution": "Université de Bamako", "year": 2018}
)

# Add availability
avail, _ = Availability.objects.get_or_create(
    teacher=teacher_profile,
    day_of_week=1,
    start_time=time(8, 0),
    end_time=time(12, 0),
    defaults={"is_recurring": True}
)

print("  Teacher profile + subjects + diploma + availability created")

# Create subscriptions for parent and etudiant
parent_user = User.objects.get(phone="+22370000001")
etudiant_user = User.objects.get(phone="+22370000005")

parent_sub, _ = Subscription.objects.get_or_create(
    user=parent_user,
    status="active",
    defaults={
        "plan": "monthly",
        "start_date": timezone.now(),
        "end_date": timezone.now() + timedelta(days=30),
    }
)

etudiant_sub, _ = Subscription.objects.get_or_create(
    user=etudiant_user,
    status="active",
    defaults={
        "plan": "monthly",
        "start_date": timezone.now(),
        "end_date": timezone.now() + timedelta(days=30),
    }
)

print("  Subscriptions created for parent & etudiant")

# Create a booking
booking, _ = Booking.objects.get_or_create(
    teacher=teacher_profile,
    parent=parent_user,
    subject=math_subj,
    date=date.today() + timedelta(days=3),
    defaults={
        "start_time": time(9, 0),
        "end_time": time(10, 0),
        "status": "pending",
        "location_type": "online",
        "price": 5000,
        "notes": "Cours de maths niveau collège",
    }
)

# Create a completed booking for reviews
completed_booking, _ = Booking.objects.get_or_create(
    teacher=teacher_profile,
    parent=parent_user,
    subject=french_subj,
    date=date.today() - timedelta(days=1),
    defaults={
        "start_time": time(14, 0),
        "end_time": time(15, 0),
        "status": "completed",
        "location_type": "at_teacher",
        "price": 5000,
    }
)

print("  Bookings created")

# Create a conversation
convo, _ = Conversation.objects.get_or_create(
    participant_1=parent_user,
    participant_2=teacher_user,
)

# Create a message
Message.objects.get_or_create(
    conversation=convo,
    sender=parent_user,
    defaults={
        "content": "Bonjour, je souhaite réserver un cours",
        "message_type": "text",
    }
)

print("  Conversation + message created")

# Create notification
AppNotification.objects.get_or_create(
    user=parent_user,
    title="Nouveau cours",
    defaults={
        "message": "Votre cours de maths est confirmé",
        "type": "booking",
    }
)

print("  Notification created")

# Create a payment
Payment.objects.get_or_create(
    user=parent_user,
    subscription=parent_sub,
    defaults={
        "amount": 1500,
        "currency": "XOF",
        "provider": "orange_money",
        "status": "success",
        "paid_at": timezone.now(),
    }
)

print("  Payment created")

print("\nSeed data ready!\n")


# ══════════════════════════════════════
# 1. AUTH ENDPOINTS
# ══════════════════════════════════════
print("=" * 60)
print("1. AUTH ENDPOINTS")
print("=" * 60)

test("Register (duplicate)", "POST", "/api/v1/auth/register/",
     400, data={
         "phone": "+22370000001", "first_name": "Test", "last_name": "Test",
         "role": "parent", "password": "Test1234", "password_confirm": "Test1234"
     })

test("Login parent", "POST", "/api/v1/auth/login/",
     200, data={"phone": "+22370000001", "password": "Test1234"},
     expected_in="access")

test("Login teacher", "POST", "/api/v1/auth/login/",
     200, data={"phone": "+22370000002", "password": "Test1234"})

test("Login admin", "POST", "/api/v1/auth/login/",
     200, data={"phone": "+22370000003", "password": "Test1234"})

test("Login etudiant", "POST", "/api/v1/auth/login/",
     200, data={"phone": "+22370000005", "password": "Test1234"})

test("Token refresh", "POST", "/api/v1/auth/token/refresh/",
     200, data={"refresh": client.post("/api/v1/auth/login/",
         data=json.dumps({"phone": "+22370000001", "password": "Test1234"}),
         content_type="application/json").json().get("refresh", "")})

test("Profile GET (parent)", "GET", "/api/v1/auth/profile/",
     200, token=parent_token, expected_in="Amadou")

test("Profile PATCH", "PATCH", "/api/v1/auth/profile/",
     200, token=parent_token, data={"city": "Bamako"})

test("Verify phone", "POST", "/api/v1/auth/verify-phone/",
     200, token=parent_token, data={"otp": "123456"})

test("Change password", "POST", "/api/v1/auth/change-password/",
     200, token=parent_token, data={"old_password": "Test1234", "new_password": "Test12345"})

# Change back
parent_user.set_password("Test1234")
parent_user.save()
parent_token = get_token("+22370000001")

test("Change password (wrong old)", "POST", "/api/v1/auth/change-password/",
     400, token=parent_token, data={"old_password": "wrong", "new_password": "Test12345"})

test("Profile unauthenticated", "GET", "/api/v1/auth/profile/", 401)


# ══════════════════════════════════════
# 2. TEACHERS ENDPOINTS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("2. TEACHERS ENDPOINTS")
print("=" * 60)

test("Subjects list", "GET", "/api/v1/teachers/subjects/",
     200, expected_in="mathematiques")

test("Levels list", "GET", "/api/v1/teachers/levels/",
     200, expected_in="college")

test("Teacher search (all)", "GET", "/api/v1/teachers/search/",
     200, expected_in="results")

test("Teacher search (by subject)", "GET", "/api/v1/teachers/search/?subject=mathematiques",
     200, expected_in="Keita")

test("Teacher search (by city)", "GET", "/api/v1/teachers/search/?city=Bamako",
     200)

test("Teacher search (min rating)", "GET", "/api/v1/teachers/search/?min_rating=0",
     200)

test("Teacher search (online)", "GET", "/api/v1/teachers/search/?online=true",
     200)

test("Teacher search (verified)", "GET", "/api/v1/teachers/search/?verified=false",
     200)

test("Teacher search (text query)", "GET", "/api/v1/teachers/search/?q=Fatoumata",
     200, expected_in="Fatoumata")

test("Teacher autocomplete", "GET", "/api/v1/teachers/autocomplete/?q=math",
     200, expected_in="subjects")

test("Teacher detail", "GET", f"/api/v1/teachers/{teacher_profile.id}/",
     200, expected_in="Keita")

test("My teacher profile", "GET", "/api/v1/teachers/me/",
     200, token=teacher_token, expected_in="bio")

test("Update my profile", "PATCH", "/api/v1/teachers/me/",
     200, token=teacher_token, data={"bio": "Prof de maths très expérimenté"})

test("Teacher diplomas list", "GET", "/api/v1/teachers/diplomas/",
     200, token=teacher_token, expected_in="Licence")

test("Teacher availability list", "GET", "/api/v1/teachers/availability/",
     200, token=teacher_token)

test("Teacher stats", "GET", "/api/v1/teachers/me/stats/",
     200, token=teacher_token, expected_in="total_students")

test("Teacher students", "GET", "/api/v1/teachers/me/students/",
     200, token=teacher_token, expected_in="results")

# Test create + delete diploma
resp = test("Create diploma", "POST", "/api/v1/teachers/diplomas/",
     201, token=teacher_token, data={"title": "Master Physique", "institution": "ENS Bamako", "year": 2020})
if resp and resp.status_code == 201:
    new_diploma_id = resp.json().get("id")
    test("Delete diploma", "DELETE", f"/api/v1/teachers/diplomas/{new_diploma_id}/",
         204, token=teacher_token)

# Test create + delete availability
resp = test("Create availability", "POST", "/api/v1/teachers/availability/",
     201, token=teacher_token, data={"day_of_week": 3, "start_time": "14:00", "end_time": "18:00", "is_recurring": True})
if resp and resp.status_code == 201:
    new_avail_id = resp.json().get("id")
    test("Delete availability", "DELETE", f"/api/v1/teachers/me/availability/{new_avail_id}/",
         204, token=teacher_token)


# ══════════════════════════════════════
# 3. BOOKINGS ENDPOINTS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("3. BOOKINGS ENDPOINTS")
print("=" * 60)

test("Bookings list (parent)", "GET", "/api/v1/bookings/",
     200, token=parent_token, expected_in="results")

test("Bookings list (teacher)", "GET", "/api/v1/bookings/",
     200, token=teacher_token)

test("Bookings list (etudiant)", "GET", "/api/v1/bookings/",
     200, token=etudiant_token)

test("Booking detail", "GET", f"/api/v1/bookings/{booking.id}/",
     200, token=parent_token)

test("Create booking (parent)", "POST", "/api/v1/bookings/create/",
     201, token=parent_token, data={
         "teacher": teacher_profile.id,
         "subject": math_subj.id,
         "date": str(date.today() + timedelta(days=5)),
         "start_time": "10:00",
         "end_time": "11:00",
         "location_type": "online",
         "price": 5000,
     })

test("Create booking (etudiant)", "POST", "/api/v1/bookings/create/",
     201, token=etudiant_token, data={
         "teacher": teacher_profile.id,
         "subject": math_subj.id,
         "date": str(date.today() + timedelta(days=6)),
         "start_time": "10:00",
         "end_time": "11:00",
         "location_type": "online",
         "price": 5000,
     })

test("Create booking (no subscription)", "POST", "/api/v1/bookings/create/",
     403, token=student_token, data={
         "teacher": teacher_profile.id,
         "subject": math_subj.id,
         "date": str(date.today() + timedelta(days=7)),
         "start_time": "10:00",
         "end_time": "11:00",
         "location_type": "online",
         "price": 5000,
     })

# Booking actions
test("Confirm booking (teacher)", "POST", f"/api/v1/bookings/{booking.id}/confirm/",
     200, token=teacher_token, expected_in="confirmed")

# Create another booking to test cancel
new_booking = Booking.objects.create(
    teacher=teacher_profile, parent=parent_user, subject=math_subj,
    date=date.today() + timedelta(days=10),
    start_time=time(9, 0), end_time=time(10, 0),
    status="pending", location_type="online", price=5000,
)
test("Cancel booking (parent)", "POST", f"/api/v1/bookings/{new_booking.id}/cancel/",
     200, token=parent_token, expected_in="cancelled")

# Complete a confirmed booking
confirmed_booking = Booking.objects.create(
    teacher=teacher_profile, parent=parent_user, subject=math_subj,
    date=date.today() - timedelta(days=2),
    start_time=time(9, 0), end_time=time(10, 0),
    status="confirmed", location_type="online", price=5000,
)
test("Complete booking (teacher)", "POST", f"/api/v1/bookings/{confirmed_booking.id}/complete/",
     200, token=teacher_token, expected_in="completed")


# ══════════════════════════════════════
# 4. REVIEWS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("4. REVIEWS")
print("=" * 60)

test("Create review (parent)", "POST", "/api/v1/bookings/reviews/",
     201, token=parent_token, data={
         "teacher": teacher_profile.id,
         "booking": completed_booking.id,
         "rating": 4,
         "comment": "Excellent cours de maths!",
     })

test("Review list for teacher", "GET", f"/api/v1/bookings/reviews/{teacher_profile.id}/",
     200, expected_in="Excellent")

# Etudiant review
etudiant_booking = Booking.objects.create(
    teacher=teacher_profile, parent=etudiant_user, subject=math_subj,
    date=date.today() - timedelta(days=3),
    start_time=time(14, 0), end_time=time(15, 0),
    status="completed", location_type="online", price=5000,
)
test("Create review (etudiant)", "POST", "/api/v1/bookings/reviews/",
     201, token=etudiant_token, data={
         "teacher": teacher_profile.id,
         "booking": etudiant_booking.id,
         "rating": 5,
         "comment": "Très bon prof!",
     })


# ══════════════════════════════════════
# 5. BOOKING PACKS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("5. BOOKING PACKS")
print("=" * 60)

test("Create pack (parent, pack_4)", "POST", "/api/v1/bookings/packs/create/",
     201, token=parent_token, data={
         "teacher": teacher_profile.id,
         "subject": math_subj.id,
         "pack_type": "pack_4",
     })

test("Create pack (etudiant, pack_8)", "POST", "/api/v1/bookings/packs/create/",
     201, token=etudiant_token, data={
         "teacher": teacher_profile.id,
         "subject": french_subj.id,
         "pack_type": "pack_8",
     })

test("List my packs (parent)", "GET", "/api/v1/bookings/packs/",
     200, token=parent_token, expected_in="pack_4")

test("List my packs (etudiant)", "GET", "/api/v1/bookings/packs/",
     200, token=etudiant_token, expected_in="pack_8")


# ══════════════════════════════════════
# 6. REPORTS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("6. REPORTS (Signalements)")
print("=" * 60)

test("Create report (parent)", "POST", "/api/v1/bookings/reports/",
     201, token=parent_token, data={
         "reported_user": teacher_user.id,
         "reason": "low_quality",
         "description": "Le professeur n'était pas préparé",
     })

test("Create report (etudiant)", "POST", "/api/v1/bookings/reports/",
     201, token=etudiant_token, data={
         "reported_user": teacher_user.id,
         "reason": "no_show",
         "description": "Le professeur ne s'est pas présenté au cours",
     })


# ══════════════════════════════════════
# 7. CHAT ENDPOINTS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("7. CHAT ENDPOINTS")
print("=" * 60)

test("Conversations list (parent)", "GET", "/api/v1/chat/conversations/",
     200, token=parent_token, expected_in="results")

test("Start conversation", "POST", "/api/v1/chat/conversations/start/",
     200, token=etudiant_token, data={"user_id": teacher_user.id})

test("Messages in conversation", "GET", f"/api/v1/chat/conversations/{convo.id}/messages/",
     200, token=parent_token, expected_in="results")

test("Mark conversation read", "POST", f"/api/v1/chat/conversations/{convo.id}/read/",
     200, token=teacher_token)


# ══════════════════════════════════════
# 8. NOTIFICATIONS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("8. NOTIFICATIONS")
print("=" * 60)

test("Notifications list", "GET", "/api/v1/notifications/",
     200, token=parent_token, expected_in="results")

test("Notifications unread count", "GET", "/api/v1/notifications/unread-count/",
     200, token=parent_token, expected_in="unread_count")

notif = AppNotification.objects.filter(user=parent_user).first()
if notif:
    test("Mark notification read", "POST", f"/api/v1/notifications/{notif.id}/read/",
         200, token=parent_token)

test("Mark all notifications read", "POST", "/api/v1/notifications/read-all/",
     200, token=parent_token)

test("Register push token", "POST", "/api/v1/notifications/register-push/",
     200, token=parent_token, data={"fcm_token": "test-fcm-token-12345"})


# ══════════════════════════════════════
# 9. PAYMENTS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("9. PAYMENTS")
print("=" * 60)

test("Check subscription", "GET", "/api/v1/payments/check-subscription/",
     200, token=parent_token)

test("My subscription", "GET", "/api/v1/payments/subscriptions/",
     200, token=parent_token)

test("Payment history", "GET", "/api/v1/payments/history/",
     200, token=parent_token)

test("Initiate payment", "POST", "/api/v1/payments/initiate/",
     200, token=parent_token, data={"plan": "monthly", "phone_number": "+22370000001"})


# ══════════════════════════════════════
# 10. CHILDREN (Parent)
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("10. CHILDREN (Parent)")
print("=" * 60)

resp = test("Create child", "POST", "/api/v1/auth/children/",
     201, token=parent_token, data={
         "first_name": "Mamadou",
         "last_name": "Diallo",
         "date_of_birth": "2015-06-15",
         "school": "École Mamadou Konaté",
         "level_id": level_college.id,
     })

child_id = None
if resp and resp.status_code == 201:
    child_id = resp.json().get("id")

test("List children", "GET", "/api/v1/auth/children/",
     200, token=parent_token, expected_in="Mamadou")

if child_id:
    test("Child detail", "GET", f"/api/v1/auth/children/{child_id}/",
         200, token=parent_token, expected_in="Mamadou")

    test("Update child", "PATCH", f"/api/v1/auth/children/{child_id}/",
         200, token=parent_token, data={"school": "Lycée Askia Mohamed"})

    test("Child progress", "GET", f"/api/v1/auth/children/{child_id}/progress/",
         200, token=parent_token)

# Also test via /api/v1/children/ path
test("Children list (alt path)", "GET", "/api/v1/children/",
     200, token=parent_token)


# ══════════════════════════════════════
# 11. STUDENT ENDPOINTS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("11. STUDENT ENDPOINTS")
print("=" * 60)

# Create bookings for student user
student_user = User.objects.get(phone="+22370000004")
Booking.objects.get_or_create(
    teacher=teacher_profile, parent=student_user, subject=math_subj,
    date=date.today() + timedelta(days=2),
    defaults={
        "start_time": time(10, 0), "end_time": time(11, 0),
        "status": "confirmed", "location_type": "online", "price": 5000,
    }
)

test("Student schedule", "GET", "/api/v1/student/schedule/",
     200, token=student_token)

test("Student progress", "GET", "/api/v1/student/progress/",
     200, token=student_token)

test("Student teachers", "GET", "/api/v1/student/teachers/",
     200, token=student_token, expected_in="results")


# ══════════════════════════════════════
# 12. SEARCH
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("12. SEARCH")
print("=" * 60)

test("Global search", "GET", "/api/v1/search/?q=math",
     200, expected_in="subjects")

test("Popular subjects", "GET", "/api/v1/search/popular/",
     200)

test("Popular subjects (by city)", "GET", "/api/v1/search/popular/?city=Bamako",
     200)


# ══════════════════════════════════════
# 13. ADMIN ENDPOINTS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("13. ADMIN ENDPOINTS")
print("=" * 60)

test("Admin dashboard", "GET", "/api/v1/admin/dashboard/",
     200, token=admin_token, expected_in="total_users")

test("Admin users list", "GET", "/api/v1/admin/users/",
     200, token=admin_token, expected_in="results")

test("Admin users (filter by role)", "GET", "/api/v1/admin/users/?role=teacher",
     200, token=admin_token)

test("Admin users (search)", "GET", "/api/v1/admin/users/?q=Amadou",
     200, token=admin_token, expected_in="Amadou")

test("Admin user detail", "GET", f"/api/v1/admin/users/{parent_user.id}/",
     200, token=admin_token, expected_in="Amadou")

test("Admin toggle user active", "POST", f"/api/v1/admin/users/{student_user.id}/toggle-active/",
     200, token=admin_token, expected_in="is_active")
# Toggle back
student_user.refresh_from_db()
if not student_user.is_active:
    student_user.is_active = True
    student_user.save()

test("Admin pending teachers", "GET", "/api/v1/admin/teachers/pending/",
     200, token=admin_token, expected_in="results")

test("Admin verify teacher", "POST", f"/api/v1/admin/teachers/{teacher_profile.id}/verify/",
     200, token=admin_token, data={"approved": True},
     expected_in="is_verified")

test("Admin bookings list", "GET", "/api/v1/admin/bookings/",
     200, token=admin_token, expected_in="results")

test("Admin bookings (filter)", "GET", "/api/v1/admin/bookings/?status=completed",
     200, token=admin_token)

test("Admin revenue", "GET", "/api/v1/admin/revenue/",
     200, token=admin_token, expected_in="total_revenue")

# Admin reports
test("Admin reports list", "GET", "/api/v1/admin/reports/",
     200, token=admin_token, expected_in="results")

report = Report.objects.filter(status="pending").first()
if report:
    test("Admin update report (review)", "PATCH", f"/api/v1/admin/reports/{report.id}/",
         200, token=admin_token, data={"status": "reviewed", "admin_notes": "En cours d'examen"})

    test("Admin resolve report", "PATCH", f"/api/v1/admin/reports/{report.id}/",
         200, token=admin_token, data={"status": "resolved", "admin_notes": "Problème résolu"})

# Admin access denied for non-admin
test("Admin dashboard (non-admin)", "GET", "/api/v1/admin/dashboard/",
     403, token=parent_token)

test("Admin users (non-admin)", "GET", "/api/v1/admin/users/",
     403, token=teacher_token)


# ══════════════════════════════════════
# 14. DELETE ACCOUNT
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("14. DELETE ACCOUNT (soft)")
print("=" * 60)

# Create a throwaway user for deletion
delete_token = register_user("+22370000099", "Delete", "Me", "parent")
test("Delete account", "DELETE", "/api/v1/auth/account/",
     204, token=delete_token)

# Verify can't login anymore
test("Login after delete", "POST", "/api/v1/auth/login/",
     401, data={"phone": "+22370000099", "password": "Test1234"})


# ══════════════════════════════════════
# 15. EDGE CASES & ERROR HANDLING
# ══════════════════════════════════════
print("\n" + "=" * 60)
print("15. EDGE CASES & ERROR HANDLING")
print("=" * 60)

test("Unauthenticated booking", "GET", "/api/v1/bookings/", 401)
test("Unauthenticated notifications", "GET", "/api/v1/notifications/", 401)
test("Unauthenticated children", "GET", "/api/v1/auth/children/", 401)
test("Invalid booking ID", "GET", "/api/v1/bookings/99999/", 404, token=parent_token)
test("Invalid teacher ID", "GET", "/api/v1/teachers/99999/", 404)
test("Short autocomplete query", "GET", "/api/v1/teachers/autocomplete/?q=m", 200)
test("Empty search", "GET", "/api/v1/teachers/search/", 200)


# ══════════════════════════════════════
# RESULTS
# ══════════════════════════════════════
print("\n" + "=" * 60)
print(f"RESULTS: {passed} PASSED / {failed} FAILED / {passed + failed} TOTAL")
print("=" * 60)

if errors:
    print("\nFailed tests:")
    for err in errors:
        print(err)

print(f"\nTest coverage: {passed}/{passed + failed} ({100 * passed // max(1, passed + failed)}%)")
