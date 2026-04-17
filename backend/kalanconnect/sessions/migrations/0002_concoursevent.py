from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("group_sessions", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ConcoursEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("type", models.CharField(
                    max_length=10,
                    choices=[
                        ("BAC",   "Baccalauréat"),
                        ("BEPC",  "BEPC"),
                        ("ENI",   "École Nationale d'Ingénieurs"),
                        ("CAT",   "Certificat d'Aptitude à l'Enseignement"),
                        ("ENA",   "École Nationale d'Administration"),
                        ("ENAM",  "ENAM"),
                        ("FMPOS", "Faculté de Médecine / FMPOS"),
                        ("other", "Autre"),
                    ],
                )),
                ("title", models.CharField(max_length=200)),
                ("year", models.PositiveSmallIntegerField()),
                ("date_inscription_limite", models.DateField(blank=True, null=True)),
                ("date_examen", models.DateField()),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["date_examen"]},
        ),
    ]
