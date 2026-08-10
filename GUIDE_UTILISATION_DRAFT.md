# GUIDE D'UTILISATION : PLATEFORME DE MONITORING NOVAREA TEXTILES BENIN 🏭📊

**Version :** 1.0  
**Statut :** Document Industriel Final  
**Date :** 01/08/2026

---

## 1. INTRODUCTION ET ACCÈS
Ce guide détaille l'utilisation de la plateforme intégrée de suivi des consommations (Électricité et Eau) pour l'usine Novarea Textiles. La plateforme est optimisée pour une utilisation sur Desktop (Audit) et Mobile (Saisie Terrain).

### 1.1 Accès à la Plateforme
L'application est accessible via l'URL sécurisée : **https://novarea-consumption.vercel.app**

[CADRE POUR CAPTURE : ÉCRAN DE LOGIN DESKTOP AVEC BRANDING]

### 1.2 Installation Mobile (PWA)
Pour installer l'application sur votre smartphone comme une application native :
1. Ouvrez l'URL dans **Safari** (iOS) ou **Chrome** (Android).
2. Cliquez sur "Partager" ou le menu "Options".
3. Sélectionnez **"Sur l'écran d'accueil"** ou **"Installer l'application"**.

[CADRE POUR CAPTURE : INSTALLATION PWA SUR MOBILE]

---

## 2. AUTHENTIFICATION SÉCURISÉE
Le système utilise une gestion des accès basée sur les rôles (RBAC).

1. Saisissez votre **Identifiant**.
2. Saisissez votre **Mot de passe**.
3. Cliquez sur **LOGIN**.

*Note : La session est limitée à 1 heure pour des raisons de sécurité industrielle.*

---

## 3. PROFIL : ADMINISTRATEUR (HUB ANALYTIQUE)
L'administrateur dispose d'une vue d'ensemble sur toute l'infrastructure.

### 3.1 Tableau de Bord (Dashboard)
Le dashboard présente les KPIs en temps réel :
- **Consommations du jour** (Électricité & Eau).
- **Moyennes journalières** calculées sur les 30 derniers jours.
- **Graphiques Dynamiques :** Analyse croisée entre la consommation et les événements opérationnels.

[CADRE POUR CAPTURE : DASHBOARD ADMINISTRATEUR - VUE ANALYTIQUE]

### 3.2 Audit des Soumissions (Submission Audit)
Toutes les saisies faites par les techniciens doivent être auditées ici.
- **Validation :** Validez les index capturés.
- **Édition :** Corrigez une erreur de saisie si nécessaire.
- **Preuve Visuelle :** Visualisez la photo du compteur jointe à chaque lecture.
- **Actions Groupées :** Possibilité de valider ou supprimer plusieurs lignes simultanément.

[CADRE POUR CAPTURE : LISTE D'AUDIT AVEC MODALE DE PRÉVISUALISATION IMAGE]

### 3.3 Contexte Journalier (Daily Events)
C'est ici que l'administrateur enregistre les anomalies de production (Coupures, Fuites, Pics PTR, etc.) pour expliquer les variations de consommation sur les graphiques.

[CADRE POUR CAPTURE : WIZARD DE CRÉATION D'ÉVÉNEMENT EN 3 ÉTAPES]

### 3.4 Centre de Génération de Rapports
Outil de construction de documents professionnels (PDF & Excel).
- **Filtres :** Semaine, Mois, Année.
- **Export PDF :** Rapport haute-fidélité avec graphiques capturés et tableaux de données.
- **Export Excel :** Export multi-feuilles (Données et Événements séparés).

[CADRE POUR CAPTURE : GÉNÉRATEUR DE RAPPORT AVEC APERÇU LIVE]

---

## 4. PROFIL : ÉLECTRICIEN / TECHNICIEN (HUB OPÉRATIONNEL)
Le technicien utilise principalement l'interface mobile pour ses relevés.

### 4.1 Accueil Mobile
Accès rapide aux indicateurs de performance de son shift et aux dernières instructions.

[CADRE POUR CAPTURE : DASHBOARD TECHNICIEN SUR MOBILE]

### 4.2 Enregistrement d'un Relevé (New Reading)
Processus simplifié en 3 étapes :
1. **Ressource :** Choisir Électricité ou Eau.
2. **Index :** Saisir la valeur du compteur (Boutons +/- pour ajustement rapide).
3. **Photo :** Capturer obligatoirement une photo du compteur comme preuve.

[CADRE POUR CAPTURE : WORKFLOW NEW READING SUR MOBILE]

### 4.3 Gestion des Missions (Mission Control)
Le technicien voit les directives envoyées par l'administrateur. Une fois la tâche terminée, il clique sur **"DONE"**. L'administrateur verra instantanément le statut mis à jour.

[CADRE POUR CAPTURE : LISTE DES MISSIONS AVEC STATUT PENDING/DONE]

---

## 5. PARAMÈTRES ET SÉCURITÉ
Accessible via l'icône de profil en haut à droite.
- **Mon Profil :** Mise à jour du nom, de l'email et de la photo de profil.
- **Sécurité :** Changement du mot de passe.
- **Gestion d'Équipe (Admin uniquement) :** Création et révocation des accès pour le personnel.

---

**Document édité pour Novarea Textiles Benin.** 🛡️🏭
