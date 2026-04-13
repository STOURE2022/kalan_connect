from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("teachers", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="teacherprofile",
            name="is_concours_specialist",
            field=models.BooleanField(
                default=False,
                help_text="Spécialiste en préparation aux concours",
            ),
        ),
    ]
