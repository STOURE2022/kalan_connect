# KalanConnect — Scénarios utilisateur

Ce document décrit les parcours utilisateur complets pour chacun des 5 rôles de l'application.

---

## 1. Parent

### 1.1 Inscription et configuration
1. Ouvrir l'app → Écran d'accueil → Appuyer sur "Créer un compte"
2. Sélectionner le rôle **"Parent"**
3. Remplir : prénom, nom, téléphone (+223), email (optionnel), quartier, mot de passe
4. Valider → Compte créé, redirection vers le dashboard Parent

### 1.2 Abonnement
1. Tenter de réserver un cours → Redirection vers l'écran "S'abonner"
2. Choisir une formule : **Mensuel (1 500 FCFA)** ou **Annuel (15 000 FCFA)**
3. Saisir le numéro Orange Money → Paiement initié
4. Confirmer sur le téléphone → Abonnement activé

### 1.3 Recherche de professeur
1. Onglet "Recherche" → Barre de recherche + filtres
2. Filtres disponibles : matière, niveau, ville, quartier, tarif min/max, note minimum, en ligne, vérifié
3. Résultats affichés en cartes : photo, nom, note, tarif, matières, distance
4. Appuyer sur un prof → Écran détail complet

### 1.4 Réservation (cours unique ou pack)
1. Sur la fiche prof → "Réserver"
2. **Étape 0 — Formule** : choisir Cours unique / Pack 4 (-10%) / Pack 8 (-15%) / Mensuel 12 (-20%)
   - Si un pack actif existe → option "Utiliser mon pack existant"
3. **Étape 1 — Matière** : sélectionner parmi les matières du prof
4. **Étape 2 — Date** : calendrier horizontal (14 jours suivants)
5. **Étape 3 — Créneau** : créneaux disponibles selon le jour sélectionné
6. **Étape 4 — Lieu** : à domicile / chez le prof / en ligne
7. **Étape 5 — Notes** : commentaire optionnel (niveau, objectifs)
8. Confirmer → Réservation créée (statut "En attente")

### 1.5 Suivi des cours
1. Onglet "Cours" → Liste des réservations
2. Statuts visibles : En attente, Confirmé, Terminé, Annulé
3. Possibilité d'annuler un cours en attente ou confirmé

### 1.6 Laisser un avis
1. Après un cours marqué "Terminé" → Notification pour laisser un avis
2. Écran avis : note (1-5 étoiles) + commentaire
3. Soumettre → Avis publié, moyenne du prof mise à jour

### 1.7 Signaler un professeur
1. Sur la fiche prof → "Signaler ce professeur" (en bas)
2. Modal de signalement : choisir raison (mauvais comportement, absence, fraude, etc.)
3. Décrire le problème (max 1000 caractères)
4. Envoyer → Signalement transmis aux administrateurs

### 1.8 Chat avec le professeur
1. Sur la fiche prof → "Contacter"
2. Ou depuis l'onglet "Chat" → Conversations existantes
3. Échange de messages texte en temps réel (WebSocket)

### 1.9 Gestion des enfants
1. Profil → Mes enfants → Ajouter un enfant
2. Renseigner : prénom, nom, date de naissance, niveau, école
3. Suivre la progression de chaque enfant

### 1.10 Gestion du profil
1. Onglet "Profil" → Modifier le profil, Notifications, Confidentialité, Aide

---

## 2. Élève (student)

> L'élève est un profil géré par un parent. Il n'a pas d'abonnement propre.

### 2.1 Connexion
1. L'élève se connecte avec les identifiants créés par le parent
2. Accès au dashboard Élève

### 2.2 Dashboard
1. Message de bienvenue "Bonjour, {prénom}"
2. Cours du jour : matière, prof, horaire, type de lieu
3. Aperçu de progression : matières avec barre de progression
4. Prochains cours : liste des 5 prochains cours

### 2.3 Emploi du temps
1. Onglet "Emploi du temps" → Vue calendrier des cours
2. Détails : matière, professeur, horaire, lieu

### 2.4 Progression
1. Écran "Progression" → Par matière
2. Pour chaque matière : prof, sessions faites/prévues, note moyenne

### 2.5 Chat
1. Onglet "Chat" → Conversations avec les professeurs
2. Échange de messages en temps réel

---

## 3. Étudiant (etudiant)

> L'étudiant universitaire est un utilisateur autonome qui peut souscrire un abonnement et réserver directement.

### 3.1 Inscription
1. Ouvrir l'app → "Créer un compte"
2. Sélectionner le rôle **"Étudiant"**
3. Remplir les informations personnelles
4. Valider → Compte créé, redirection vers le dashboard Étudiant

### 3.2 Abonnement
1. Même parcours que le parent
2. Formules : Mensuel (1 500 FCFA) ou Annuel (15 000 FCFA)
3. Paiement via Orange Money

### 3.3 Dashboard Étudiant
1. Message "Bonjour, {prénom} !"
2. Actions rapides : Trouver un prof, Mes cours, Messages
3. Prochains cours avec statut (confirmé / en attente)
4. Si aucun cours → message + bouton "Trouver un professeur"

### 3.4 Recherche de professeur
1. Onglet "Recherche" → Même interface que le parent
2. Filtres complets : matière, ville, tarif, note, en ligne, vérifié

### 3.5 Réservation (cours unique ou pack)
1. Même parcours que le parent (étape 0 → formule, puis matière, date, créneau, lieu)
2. L'étudiant peut acheter des packs de cours avec réduction
3. Les packs existants sont proposés automatiquement

### 3.6 Laisser un avis
1. Après cours terminé → Note + commentaire
2. L'étudiant peut évaluer ses propres cours

### 3.7 Signaler un professeur
1. Sur la fiche prof → "Signaler"
2. Même interface que le parent : raison + description

### 3.8 Chat
1. Onglet "Chat" → Conversations avec les professeurs
2. Messages en temps réel

### 3.9 Profil
1. Modifier profil, gérer notifications, aide

---

## 4. Professeur (teacher)

### 4.1 Inscription
1. "Créer un compte" → Sélectionner **"Professeur"**
2. Remplir les informations de base
3. Valider → Compte créé, accès limité en attente de vérification

### 4.2 Compléter le profil
1. Dashboard prof → "Compléter votre profil"
2. Ajouter : photo, biographie, tarif horaire, expérience
3. Ajouter les matières enseignées + niveaux
4. Ajouter les diplômes (titre, institution, année, document)
5. Configurer : enseigne en ligne / à domicile / chez le prof
6. Définir le rayon de déplacement (km)

### 4.3 Vérification par l'admin
1. Le profil est soumis à vérification
2. Statut "En attente" → Badge "Vérifié" après approbation
3. Notification reçue quand le profil est vérifié

### 4.4 Gérer les disponibilités
1. Écran "Disponibilités" → Ajouter des créneaux
2. Par jour de la semaine : heure début → heure fin
3. Créneaux récurrents ou ponctuels
4. Supprimer un créneau existant

### 4.5 Accepter / Refuser des cours
1. Dashboard → Notification de nouvelle réservation
2. Onglet "Cours" → Réservations "En attente"
3. Confirmer → Statut passe à "Confirmé"
4. Le parent/étudiant est notifié

### 4.6 Compléter un cours
1. Après le cours → Marquer comme "Terminé"
2. Les statistiques sont mises à jour (total bookings +1)

### 4.7 Suivre les revenus
1. Dashboard → Stats : revenus ce mois, revenus totaux
2. Nombre de cours, nombre d'élèves, note moyenne

### 4.8 Voir ses élèves
1. Onglet "Élèves" → Liste des élèves/parents
2. Nombre de sessions par élève, dernière session

### 4.9 Chat
1. Onglet "Chat" → Conversations avec parents/étudiants
2. Messages en temps réel

### 4.10 Profil
1. Modifier le profil professeur (bio, tarif, photo, matières)
2. Gérer les disponibilités

---

## 5. Administrateur (admin)

### 5.1 Dashboard
1. Connexion → Tableau de bord administrateur
2. Vue d'ensemble :
   - Revenu total + tendance mensuelle
   - Stats : utilisateurs, professeurs, parents, élèves, réservations, abonnements
   - Actions rapides
   - Stats du mois en cours

### 5.2 Gestion des utilisateurs
1. Onglet "Utilisateurs" → Liste paginée
2. Filtrer par rôle, rechercher par nom/téléphone
3. Voir le détail d'un utilisateur
4. Activer / Désactiver un compte

### 5.3 Vérification des professeurs
1. Onglet "Vérifications" → Profs en attente
2. Voir le profil complet (bio, diplômes, matières)
3. Approuver → Badge "Vérifié" ajouté
4. Refuser → Raison envoyée au professeur

### 5.4 Gestion des signalements
1. Onglet "Signalements" → Liste avec filtres (En attente, Examiné, Résolu, Rejeté)
2. Chaque signalement affiche :
   - Utilisateur signalé
   - Raison (badge coloré)
   - Description
   - Signaleur + date
3. Actions :
   - **Examiner** → Statut "Examiné" (en cours de traitement)
   - **Résoudre** → Statut "Résolu" (action prise)
   - **Rejeter** → Statut "Rejeté" (signalement non fondé)

### 5.5 Alertes automatiques
1. Quand la note moyenne d'un prof tombe sous **2.5/5** (avec au moins 3 avis) :
   - Notification automatique créée pour tous les admins
   - Type : "Alerte qualité professeur"
   - Message : nom du prof + note moyenne + nombre d'avis
2. L'admin peut consulter le profil du prof et prendre action

### 5.6 Statistiques revenus
1. Dashboard → Revenu total
2. Stats mensuelles détaillées

### 5.7 Gestion des réservations
1. Action rapide → "Réservations" → Vue de toutes les réservations
2. Filtrer par statut

---

## Matrice des permissions

| Action | Parent | Élève | Étudiant | Professeur | Admin |
|--------|--------|-------|----------|------------|-------|
| S'inscrire | Oui | Via parent | Oui | Oui | — |
| Souscrire abonnement | Oui | — | Oui | — | — |
| Rechercher un prof | Oui | Oui | Oui | — | — |
| Réserver un cours | Oui (abo) | — | Oui (abo) | — | — |
| Acheter un pack | Oui (abo) | — | Oui (abo) | — | — |
| Annuler un cours | Oui | — | Oui | Oui | — |
| Confirmer un cours | — | — | — | Oui | — |
| Compléter un cours | — | — | — | Oui | — |
| Laisser un avis | Oui | — | Oui | — | — |
| Signaler un utilisateur | Oui | — | Oui | — | — |
| Chat | Oui | Oui | Oui | Oui | Oui |
| Voir signalements | — | — | — | — | Oui |
| Traiter signalements | — | — | — | — | Oui |
| Vérifier profs | — | — | — | — | Oui |
| Gérer utilisateurs | — | — | — | — | Oui |

---

## Formules de cours

| Formule | Séances | Réduction | Exemple (tarif 5000 FCFA/h) |
|---------|---------|-----------|----------------------------|
| Cours unique | 1 | 0% | 5 000 FCFA |
| Pack 4 cours | 4 | 10% | 18 000 FCFA (4 500/cours) |
| Pack 8 cours | 8 | 15% | 34 000 FCFA (4 250/cours) |
| Mensuel (12 cours) | 12 | 20% | 48 000 FCFA (4 000/cours) |

---

## Flux d'un signalement

```
Utilisateur signale → Signalement créé (pending)
        ↓
Admin consulte → Marque "Examiné" (reviewed)
        ↓
   ┌────┴────┐
   ↓         ↓
Résolu    Rejeté
(resolved) (dismissed)
```

## Flux d'alerte automatique

```
Utilisateur laisse un avis
        ↓
Moyenne prof recalculée
        ↓
Si avg < 2.5 ET total_reviews >= 3
        ↓
Notification admin créée automatiquement
        ↓
Admin consulte et prend action
```