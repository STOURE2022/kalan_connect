from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0002_alter_payment_idempotency_key"),
    ]

    operations = [
        migrations.AlterField(
            model_name="subscription",
            name="plan",
            field=models.CharField(
                max_length=10,
                choices=[
                    ("monthly", "Mensuel — 1 500 FCFA"),
                    ("annual", "Annuel — 15 000 FCFA"),
                    ("concours", "Concours — 3 500 FCFA (3 mois)"),
                ],
            ),
        ),
    ]
