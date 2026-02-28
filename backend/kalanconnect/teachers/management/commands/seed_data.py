"""
KalanConnect — Commande pour charger les données initiales (matières, niveaux)
Usage: python manage.py seed_data
"""

from django.core.management.base import BaseCommand

from kalanconnect.teachers.models import Level, Subject


class Command(BaseCommand):
    help = "Charger les matières et niveaux scolaires du Mali"

    def handle(self, *args, **options):
        self.stdout.write("Chargement des matières...")

        subjects = [
            # Sciences
            ("Mathématiques", "mathematiques", "calculator", "sciences"),
            ("Physique", "physique", "atom", "sciences"),
            ("Chimie", "chimie", "flask", "sciences"),
            ("Sciences de la Vie et de la Terre", "svt", "leaf", "sciences"),
            ("Sciences Physiques", "sciences-physiques", "microscope", "sciences"),
            # Lettres
            ("Français", "francais", "book-open", "lettres"),
            ("Philosophie", "philosophie", "brain", "lettres"),
            ("Histoire-Géographie", "histoire-geo", "globe", "lettres"),
            ("Éducation Civique", "education-civique", "flag", "lettres"),
            # Langues
            ("Anglais", "anglais", "message-circle", "langues"),
            ("Arabe", "arabe", "type", "langues"),
            ("Bambara", "bambara", "message-square", "langues"),
            ("Espagnol", "espagnol", "message-circle", "langues"),
            ("Allemand", "allemand", "message-circle", "langues"),
            # Informatique
            ("Informatique", "informatique", "monitor", "informatique"),
            ("Programmation", "programmation", "code", "informatique"),
            # Arts
            ("Musique", "musique", "music", "arts"),
            ("Dessin", "dessin", "pen-tool", "arts"),
            # Autre
            ("Comptabilité", "comptabilite", "file-text", "autre"),
            ("Économie", "economie", "trending-up", "autre"),
            ("Droit", "droit", "shield", "autre"),
        ]

        for name, slug, icon, category in subjects:
            Subject.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "icon": icon, "category": category},
            )
        self.stdout.write(self.style.SUCCESS(f"  {len(subjects)} matières créées"))

        self.stdout.write("Chargement des niveaux...")

        levels = [
            ("1ère année (Fondamental)", "1ere-annee", 1),
            ("2ème année (Fondamental)", "2eme-annee", 2),
            ("3ème année (Fondamental)", "3eme-annee", 3),
            ("4ème année (Fondamental)", "4eme-annee", 4),
            ("5ème année (Fondamental)", "5eme-annee", 5),
            ("6ème année (Fondamental)", "6eme-annee", 6),
            ("7ème année (Collège)", "7eme-annee", 7),
            ("8ème année (Collège)", "8eme-annee", 8),
            ("9ème année (Collège)", "9eme-annee", 9),
            ("10ème année (Lycée)", "10eme-annee", 10),
            ("11ème année (Lycée)", "11eme-annee", 11),
            ("Terminale (Lycée)", "terminale", 12),
            ("Université / Supérieur", "superieur", 13),
            ("Formation professionnelle", "formation-pro", 14),
            ("Adulte / Remise à niveau", "adulte", 15),
        ]

        for name, slug, order in levels:
            Level.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "order": order},
            )
        self.stdout.write(self.style.SUCCESS(f"  {len(levels)} niveaux créés"))

        self.stdout.write(self.style.SUCCESS("Données initiales chargées !"))
