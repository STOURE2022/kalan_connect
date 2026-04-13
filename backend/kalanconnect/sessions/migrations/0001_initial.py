from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("teachers", "0003_teacherprofile_identity_cv"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="GroupSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True)),
                ("date", models.DateField()),
                ("start_time", models.TimeField()),
                ("end_time", models.TimeField()),
                ("location_type", models.CharField(choices=[("online", "En ligne"), ("at_teacher", "Chez le professeur"), ("other", "Autre lieu")], default="online", max_length=20)),
                ("address", models.CharField(blank=True, max_length=255)),
                ("max_participants", models.PositiveIntegerField(default=10)),
                ("price_per_student", models.PositiveIntegerField(default=0)),
                ("status", models.CharField(choices=[("open", "Ouvert"), ("full", "Complet"), ("cancelled", "Annulé"), ("completed", "Terminé")], default="open", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("teacher", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="group_sessions", to="teachers.teacherprofile")),
                ("subject", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="+", to="teachers.subject")),
            ],
            options={"ordering": ["date", "start_time"]},
        ),
        migrations.CreateModel(
            name="SessionRegistration",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("registered", "Inscrit"), ("cancelled", "Annulé")], default="registered", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("session", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="registrations", to="group_sessions.groupsession")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="session_registrations", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"], "unique_together": {("session", "user")}},
        ),
    ]
