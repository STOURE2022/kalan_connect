from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("teachers", "0002_teacherprofile_is_concours_specialist"),
    ]

    operations = [
        migrations.AddField(
            model_name="teacherprofile",
            name="identity_document_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("nina", "Carte NINA"),
                    ("passeport", "Passeport"),
                    ("cni", "Carte Nationale d'Identité"),
                ],
                default="",
                help_text="Type de pièce d'identité",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="teacherprofile",
            name="identity_document",
            field=models.FileField(
                blank=True,
                help_text="Scan pièce d'identité (NINA / Passeport / CNI)",
                upload_to="teachers/identity/",
            ),
        ),
        migrations.AddField(
            model_name="teacherprofile",
            name="cv",
            field=models.FileField(
                blank=True,
                help_text="Curriculum Vitae du professeur",
                upload_to="teachers/cv/",
            ),
        ),
    ]
