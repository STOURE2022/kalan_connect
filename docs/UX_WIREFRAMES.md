# KalanConnect — Maquettes UX Détaillées

> Design mobile-first, moderne, inspiré Airbnb/Superprof mais adapté au Mali
> Couleurs : Vert (#10B981) + Or (#F59E0B) + Blanc — rappel du drapeau malien

---

## 1. PAGE D'ACCUEIL (Landing)

```
┌─────────────────────────────────────────┐
│  🟢 KalanConnect          [Connexion]   │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │                                     │ │
│  │   Trouvez le meilleur               │ │
│  │   professeur pour                   │ │
│  │   votre enfant 🎓                   │ │
│  │                                     │ │
│  │   +500 professeurs à Bamako         │ │
│  │                                     │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │🔍 Quelle matière ?          │   │ │
│  │  │   Maths, Français, Anglais..│   │ │
│  │  └──────────────────────────────┘   │ │
│  │                                     │ │
│  │  ┌─────────────┐ ┌──────────────┐   │ │
│  │  │📍 Bamako   ▼│ │📚 Niveau   ▼│   │ │
│  │  └─────────────┘ └──────────────┘   │ │
│  │                                     │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │     🔍  RECHERCHER           │   │ │
│  │  └──────────────────────────────┘   │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ── Matières populaires ──              │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  📐  │ │  📖  │ │  🔬  │ │  🌍  │   │
│  │Maths │ │Franç.│ │Phys. │ │Angl. │   │
│  │ 120  │ │  98  │ │  67  │ │  85  │   │
│  │profs │ │profs │ │profs │ │profs │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                         │
│  ── Professeurs en vedette ──           │
│                                         │
│  ┌─────────────────────────────────────┐ │
│  │ 📷  Moussa K.        ⭐ 4.9 (32)  │ │
│  │      Maths, Physique               │ │
│  │      📍 Badalabougou               │ │
│  │      3 000 FCFA/h    ✓ Vérifié    │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 📷  Fatou D.          ⭐ 4.7 (28) │ │
│  │      Français, Anglais             │ │
│  │      📍 Hamdallaye                 │ │
│  │      2 500 FCFA/h    ✓ Vérifié    │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ── Comment ça marche ──                │
│                                         │
│  ① Recherchez    ② Contactez           │
│  un professeur   le professeur          │
│                                         │
│  ③ Réservez      ④ Progressez          │
│  un cours        ensemble !             │
│                                         │
│  ── Tarif unique ──                     │
│                                         │
│  ┌────────────────┐ ┌────────────────┐  │
│  │   MENSUEL      │ │   ANNUEL ⭐    │  │
│  │                │ │                │  │
│  │  1 500 FCFA    │ │ 15 000 FCFA   │  │
│  │   /mois        │ │  /an           │  │
│  │                │ │ (2 mois offerts)│ │
│  │  [S'abonner]   │ │ [S'abonner]    │ │
│  └────────────────┘ └────────────────┘  │
│                                         │
│  ─── Footer ───                         │
│  KalanConnect © 2026 | Bamako, Mali     │
│  À propos | Contact | CGU              │
└─────────────────────────────────────────┘
```

---

## 2. PAGE RECHERCHE (Résultats)

```
┌─────────────────────────────────────────┐
│ ← Recherche    "Maths à Bamako"        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │🔍 Mathématiques                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌────────┐┌────────┐┌─────────┐┌─────┐ │
│ │📍Ville ││📚Niveau││💰 Prix  ││⚡Tri│ │
│ │Bamako ▼││Tous   ▼││  Tous  ▼││Note▼│ │
│ └────────┘└────────┘└─────────┘└─────┘ │
│                                         │
│ ☑ En ligne  ☑ Vérifié uniquement       │
│                                         │
│ 45 professeurs trouvés                  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │┌────┐                              │ │
│ ││ 📷 │ Moussa Keita         ⭐ 4.9 │ │
│ ││    │ Maths, Physique       32 avis│ │
│ │└────┘ 📍 Badalabougou (2.3 km)    │ │
│ │       ⏱ Répond en 2h              │ │
│ │       💰 3 000 FCFA/h  ✓ Vérifié │ │
│ │       🏠 À domicile  💻 En ligne  │ │
│ │                                    │ │
│ │  [Voir le profil]  [💬 Contacter] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │┌────┐                              │ │
│ ││ 📷 │ Aminata Traoré      ⭐ 4.8 │ │
│ ││    │ Maths               18 avis │ │
│ │└────┘ 📍 ACI 2000 (1.1 km)       │ │
│ │       ⏱ Répond en 1h              │ │
│ │       💰 2 500 FCFA/h  ✓ Vérifié │ │
│ │       🏠 À domicile               │ │
│ │                                    │ │
│ │  [Voir le profil]  [💬 Contacter] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │┌────┐                              │ │
│ ││ 📷 │ Ibrahim Coulibaly   ⭐ 4.6 │ │
│ ││    │ Maths, SVT          12 avis │ │
│ │└────┘ 📍 Kalaban Coura (4.5 km)  │ │
│ │       💰 2 000 FCFA/h             │ │
│ │       🏠 À domicile  💻 En ligne  │ │
│ │                                    │ │
│ │  [Voir le profil]  [💬 Contacter] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│           [ Charger plus ↓ ]            │
│                                         │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│ │ 🏠 │ │ 🔍 │ │ 📅 │ │ 💬 │ │ 👤 │    │
│ │Home │ │Rech│ │Cours│ │Chat│ │Profil  │
│ └────┘ └────┘ └────┘ └────┘ └────┘    │
└─────────────────────────────────────────┘
```

---

## 3. PAGE PROFIL PROFESSEUR

```
┌─────────────────────────────────────────┐
│ ←                            ♡  ⋯      │
│                                         │
│         ┌──────────────┐                │
│         │              │                │
│         │    Photo     │                │
│         │   Moussa K.  │                │
│         │              │                │
│         └──────────────┘                │
│                                         │
│    Moussa Keita                         │
│    ⭐ 4.9/5 (32 avis) · ✓ Vérifié     │
│                                         │
│    📍 Badalabougou, Bamako              │
│    🎓 8 ans d'expérience               │
│    ⏱ Répond en ~2h                     │
│                                         │
│  ┌────────────────────────────────────┐  │
│  │  💰 3 000 FCFA / heure            │  │
│  │                                    │  │
│  │  [📅 Réserver un cours]           │  │
│  │  [💬 Envoyer un message]          │  │
│  └────────────────────────────────────┘  │
│                                         │
│  ── À propos ──                         │
│                                         │
│  "Professeur passionné de mathématiques │
│  et de physique. Diplômé de l'ENSup de  │
│  Bamako, j'enseigne depuis 8 ans avec   │
│  une approche pratique et adaptée à     │
│  chaque élève. Mes élèves obtiennent    │
│  d'excellents résultats au DEF et au    │
│  BAC."                                  │
│                                         │
│  ── Matières & Niveaux ──              │
│                                         │
│  ┌──────────────────┐ ┌──────────────┐  │
│  │ 📐 Mathématiques │ │ 🔬 Physique  │  │
│  │ Collège · Lycée  │ │ Lycée        │  │
│  └──────────────────┘ └──────────────┘  │
│                                         │
│  ── Type de cours ──                    │
│                                         │
│  🏠 À domicile (rayon 5 km)            │
│  🏫 Chez le professeur                 │
│  💻 En ligne                            │
│                                         │
│  ── Diplômes ──                         │
│                                         │
│  🎓 Licence Mathématiques              │
│     ENSup Bamako · 2018                │
│  🎓 CAPES Mathématiques                │
│     IFM · 2016                          │
│                                         │
│  ── Disponibilités ──                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Lun  Mar  Mer  Jeu  Ven  Sam  │    │
│  │                                 │    │
│  │ 08h  ░░░  ░░░  ░░░  ░░░  ░░░  │    │
│  │ 10h  ░░░  ███  ░░░  ███  ░░░  │    │
│  │ 12h  ░░░  ░░░  ░░░  ░░░  ░░░  │    │
│  │ 14h  ███  ███  ███  ███  ░░░  │    │
│  │ 16h  ███  ███  ███  ███  ░░░  │    │
│  │ 18h  ███  ░░░  ███  ░░░  ███  │    │
│  │                                 │    │
│  │ ███ = Disponible               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ── Avis (32) ──                        │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Fatoumata S.          ⭐⭐⭐⭐⭐ │    │
│  │ Il y a 2 semaines               │    │
│  │ "Excellent professeur ! Mon fils │    │
│  │ a eu 16/20 en maths grâce à     │    │
│  │ Moussa. Très patient."           │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Amadou D.             ⭐⭐⭐⭐  │    │
│  │ Il y a 1 mois                    │    │
│  │ "Bon prof, ponctuel. Il explique │    │
│  │ bien les concepts difficiles."   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Voir tous les avis →]                 │
│                                         │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│ │ 🏠 │ │ 🔍 │ │ 📅 │ │ 💬 │ │ 👤 │    │
│ │Home │ │Rech│ │Cours│ │Chat│ │Profil  │
│ └────┘ └────┘ └────┘ └────┘ └────┘    │
└─────────────────────────────────────────┘
```

---

## 4. ÉCRAN RÉSERVATION

```
┌─────────────────────────────────────────┐
│ ← Réserver un cours                     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📷 Moussa Keita                     │ │
│ │    Mathématiques · 3 000 FCFA/h     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│  ── Choisir la matière ──              │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ ● Mathématiques                    │ │
│  │ ○ Physique                         │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ── Choisir la date ──                 │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │     ◄  Mars 2026  ►               │ │
│  │                                    │ │
│  │  Lu  Ma  Me  Je  Ve  Sa  Di       │ │
│  │                                    │ │
│  │              1   2   3   4   5    │ │
│  │   6   7   8   9  10  11  12      │ │
│  │  13  14 [15] 16  17  18  19      │ │
│  │  20  21  22  23  24  25  26      │ │
│  │  27  28  29  30  31              │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ── Choisir le créneau ──              │
│  (Samedi 15 Mars)                       │
│                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ 10h-12h│ │[14h-16h]│ │ 16h-18h│     │
│  │        │ │ ✓       │ │        │      │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│  ── Lieu du cours ──                   │
│                                         │
│  ○ 🏠 Chez moi (à domicile)           │
│  ● 🏫 Chez le professeur              │
│  ○ 💻 En ligne                         │
│                                         │
│  ── Adresse (si à domicile) ──         │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ Hamdallaye ACI 2000, Bamako       │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ── Notes pour le professeur ──        │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ Mon fils est en 9ème année, il a  │ │
│  │ des difficultés en algèbre...     │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  RÉCAPITULATIF                     │ │
│  │                                    │ │
│  │  Prof: Moussa Keita               │ │
│  │  Matière: Mathématiques           │ │
│  │  Date: Sam 15 Mars, 14h–16h      │ │
│  │  Lieu: Chez le professeur         │ │
│  │  Durée: 2h                        │ │
│  │  ──────────────────────           │ │
│  │  Total: 6 000 FCFA               │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │     📅  CONFIRMER LA RÉSERVATION  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 5. ÉCRAN MESSAGERIE

### Liste des conversations
```
┌─────────────────────────────────────────┐
│ Messages                          ✏️    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │🔍 Rechercher une conversation      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📷 Moussa Keita           14:32   │ │
│ │    🟢 En ligne                      │ │
│ │    "D'accord, je serai là à 14h"   │ │
│ │                              ✓✓ Lu │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📷 Aminata Traoré         Hier    │ │
│ │    "Merci pour le cours, mon fils  │ │
│ │    a bien compris !"               │ │
│ │                         ● 2 new    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📷 Ibrahim C.            Mar 12    │ │
│ │    "Le prochain cours est prévu..." │ │
│ │                              ✓✓ Lu │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│ │ 🏠 │ │ 🔍 │ │ 📅 │ │ 💬 │ │ 👤 │    │
│ │Home │ │Rech│ │Cours│ │Chat│ │Profil  │
│ └────┘ └────┘ └────┘ └────┘ └────┘    │
└─────────────────────────────────────────┘
```

### Conversation ouverte
```
┌─────────────────────────────────────────┐
│ ← Moussa Keita          🟢 En ligne    │
│    Maths · ⭐ 4.9                       │
│─────────────────────────────────────────│
│                                         │
│                        ┌──────────────┐ │
│                        │ Bonjour      │ │
│                        │ Moussa, je   │ │
│                        │ cherche un   │ │
│                        │ prof de maths│ │
│                        │ pour mon     │ │
│                        │ fils.        │ │
│                        │      14:20 ✓✓│ │
│                        └──────────────┘ │
│                                         │
│  ┌──────────────┐                       │
│  │ Bonjour ! Pas│                       │
│  │ de problème. │                       │
│  │ Quel niveau  │                       │
│  │ et quelles   │                       │
│  │ difficultés ?│                       │
│  │ 14:22        │                       │
│  └──────────────┘                       │
│                                         │
│                        ┌──────────────┐ │
│                        │ 9ème année,  │ │
│                        │ surtout      │ │
│                        │ l'algèbre et │ │
│                        │ la géométrie │ │
│                        │      14:25 ✓✓│ │
│                        └──────────────┘ │
│                                         │
│  ┌──────────────┐                       │
│  │ D'accord, je │                       │
│  │ serai là à   │                       │
│  │ 14h          │                       │
│  │ 14:32        │                       │
│  └──────────────┘                       │
│                                         │
│  Moussa est en train d'écrire...        │
│                                         │
│ ┌─────────────────────────┐ ┌────┐ ┌──┐│
│ │ Votre message...        │ │ 📎 │ │➤ ││
│ └─────────────────────────┘ └────┘ └──┘│
└─────────────────────────────────────────┘
```

---

## 6. ÉCRAN PAIEMENT / ABONNEMENT

```
┌─────────────────────────────────────────┐
│ ← S'abonner à KalanConnect             │
│                                         │
│         🔓                              │
│    Accédez à tous les                   │
│    professeurs de Bamako                │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  ✓ Voir tous les profils          │ │
│  │  ✓ Contacter les professeurs      │ │
│  │  ✓ Réserver des cours             │ │
│  │  ✓ Messagerie illimitée           │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ── Choisir votre plan ──              │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  ○  MENSUEL                        │ │
│  │                                    │ │
│  │     1 500 FCFA / mois             │ │
│  │     Sans engagement               │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  ●  ANNUEL ⭐ MEILLEURE OFFRE     │ │
│  │                                    │ │
│  │     15 000 FCFA / an              │ │
│  │     = 1 250 FCFA/mois             │ │
│  │     Économisez 3 000 FCFA !       │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ── Paiement Orange Money ──           │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  🟠 Orange Money                   │ │
│  │                                    │ │
│  │  Numéro Orange Money :            │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │ +223 7X XX XX XX            │  │ │
│  │  └──────────────────────────────┘  │ │
│  │                                    │ │
│  │  Vous recevrez une demande de     │ │
│  │  confirmation sur votre téléphone │ │
│  │  via USSD (*144#).                │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  RÉCAPITULATIF                     │ │
│  │  Plan: Annuel                     │ │
│  │  Montant: 15 000 FCFA            │ │
│  │  Moyen: Orange Money              │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  🟠  PAYER 15 000 FCFA            │ │
│  │      via Orange Money              │ │
│  └────────────────────────────────────┘ │
│                                         │
│  🔒 Paiement sécurisé                  │
│  En cliquant, vous acceptez les CGU     │
│                                         │
│  ── Après clic ──                       │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │    ⏳ En attente de confirmation   │ │
│  │                                    │ │
│  │    Confirmez le paiement de       │ │
│  │    15 000 FCFA sur votre          │ │
│  │    téléphone Orange Money         │ │
│  │                                    │ │
│  │    Composez *144# si vous         │ │
│  │    n'avez pas reçu la demande     │ │
│  │                                    │ │
│  │    [Annuler]                       │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ── Après succès ──                     │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │    ✅ Paiement réussi !           │ │
│  │                                    │ │
│  │    Votre abonnement est actif     │ │
│  │    jusqu'au 27 Mars 2027          │ │
│  │                                    │ │
│  │    [🔍 Trouver un professeur]     │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 7. NAVIGATION MOBILE (Bottom Tab Bar)

```
┌────────────────────────────────────────┐
│  🏠        🔍        📅       💬   👤  │
│ Accueil  Recherche  Cours   Chat Profil│
│                                        │
│ Badge sur Chat: nombre messages non lus│
│ Badge sur Cours: réservations en attente│
└────────────────────────────────────────┘
```

---

## 8. ÉCRAN PROFIL / TABLEAU DE BORD PARENT

```
┌─────────────────────────────────────────┐
│ Mon profil                              │
│                                         │
│         ┌────────┐                      │
│         │  📷    │                      │
│         │ Avatar │                      │
│         └────────┘                      │
│      Amadou Diallo                      │
│      +223 70 00 00 00                   │
│      📍 Hamdallaye, Bamako             │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ 📊 Mon abonnement                 │ │
│  │ Plan: Annuel ✅ Actif             │ │
│  │ Expire le: 27 Mars 2027          │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ 📅 Mes réservations        Voir > │ │
│  │ 3 cours à venir                   │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ ⭐ Mes avis                 Voir > │ │
│  │ 5 avis laissés                    │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ 💳 Historique paiements    Voir > │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ ⚙️  Paramètres                     │ │
│  │ 🔔 Notifications                  │ │
│  │ 🌙 Mode sombre                    │ │
│  │ 🌐 Langue                         │ │
│  │ ❓ Aide & Support                 │ │
│  │ 📄 CGU                            │ │
│  └────────────────────────────────────┘ │
│                                         │
│  [🚪 Se déconnecter]                   │
│                                         │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│ │ 🏠 │ │ 🔍 │ │ 📅 │ │ 💬 │ │ 👤 │    │
│ │Home │ │Rech│ │Cours│ │Chat│ │Profil  │
│ └────┘ └────┘ └────┘ └────┘ └────┘    │
└─────────────────────────────────────────┘
```

---

## Principes de design

1. **Couleurs** : Vert (#10B981), Or (#F59E0B), fond blanc/gris clair
2. **Typographie** : Inter ou Poppins (moderne, lisible sur mobile)
3. **Espacement** : Généreux, aéré, facile à toucher
4. **Images** : Photos réelles de professeurs maliens, couleurs chaudes
5. **Langue** : Français par défaut, option Bambara
6. **Performance** : Images optimisées (WebP), lazy loading, squelettes de chargement
7. **Accessibilité** : Contrastes forts, tailles de texte adaptées, navigation clavier
8. **Hors-ligne** : Message de statut réseau, cache des pages consultées
