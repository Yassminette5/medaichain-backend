# 🏥 MedAIChain — Plateforme Médicale Intelligente

MedAIChain est une plateforme de santé connectée qui combine l'intelligence artificielle et la blockchain pour digitaliser et sécuriser le parcours médical.

## 🏗️ Architecture du Projet

```
pim-25/
├── medaichain-backend/          ← API NestJS (ce dossier)
├── medaichain-mobile-*/         ← Application Flutter (patient & médecin)
└── ai-training/                 ← Fine-tuning du modèle IA médical
```

## ✨ Fonctionnalités Principales

### 👨‍⚕️ Côté Médecin
- **Analyse IA de rapports médicaux** — Le modèle IA analyse directement les photos d'analyses (sang, bilans, radios) et retourne un diagnostic structuré en JSON
- **Gestion des ordonnances** — Création, validation et suivi des prescriptions
- **Téléconsultation vidéo** — Appels vidéo patient-médecin via Agora
- **Tableau de bord** — Vue d'ensemble des patients et des analyses en attente

### 🧑‍🤒 Côté Patient
- **Upload d'analyses médicales** — Envoi de photos / PDFs de résultats d'analyses
- **Suivi des conseils IA** — Réception des diagnostics et conseils personnalisés
- **Historique des prescriptions** — Consultation de l'historique des ordonnances
- **Notifications push** — Alertes en temps réel via FCM

### 🤖 Intelligence Artificielle
- **Modèle** : LLaVA v1.5 7B (multimodal/vision), fine-tuné sur des données médicales
- **Entraînement** : Kaggle Notebooks avec GPU T4×2
- **Déploiement** : Ollama (inférence locale, aucune donnée envoyée au cloud)
- **Pipeline** : OCR Tesseract pour les PDFs → Ollama pour l'analyse

## 🚀 Installation & Démarrage

### Prérequis
- Node.js 18+
- MongoDB
- Ollama (pour le modèle IA)

### Lancer le backend

```bash
cd medaichain-backend
npm install
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`

### Variables d'environnement (`.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | URI de connexion MongoDB |
| `JWT_SECRET` | Clé secrète JWT |
| `OLLAMA_URL` | URL de l'API Ollama (`http://localhost:11434/api/generate`) |
| `OLLAMA_MODEL` | Nom du modèle Ollama (`medaichain-medical`) |
| `AGORA_APP_ID` | App ID Agora pour la vidéo |
| `SMTP_USER` / `SMTP_PASS` | Identifiants SMTP pour les emails |

## 🧠 Entraînement du Modèle IA

Le modèle est entraîné sur **Kaggle** avec GPU T4×2. Voir le dossier `ai-training/` pour :
- `kaggle_training_notebook.py` — Notebook d'entraînement complet
- `prepare_kaggle_dataset.py` — Préparation du dataset pour Kaggle
- `medical_dataset.jsonl` — Dataset de 50 exemples médicaux annotés
- `dataset/` — 50 images de rapports médicaux

### Pipeline d'entraînement

1. Préparer le dataset → `python prepare_kaggle_dataset.py`
2. Uploader sur Kaggle comme Dataset
3. Exécuter le notebook sur Kaggle (GPU T4×2)
4. Télécharger le modèle GGUF exporté
5. Importer dans Ollama : `ollama create medaichain-medical -f Modelfile`

## 📡 API Endpoints Principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/doctor-ai/status` | Vérifier la disponibilité du modèle IA |
| `POST` | `/doctor-ai/analyze` | Analyser une image (base64) |
| `POST` | `/doctor-ai/analyze-text` | Analyser du texte médical |
| `POST` | `/doctor-ai/analyze-upload` | Analyser via upload de fichier |
| `GET` | `/doctor-ai/pending-analyses` | Lister les analyses en attente |
| `POST` | `/doctor-ai/accept-suggestion` | Accepter une suggestion IA et créer une ordonnance |

## 🛠️ Technologies

| Composant | Technologie |
|-----------|-------------|
| Backend | NestJS (TypeScript) |
| Base de données | MongoDB + Mongoose |
| Application mobile | Flutter (Dart) |
| IA | LLaVA 7B + LoRA (via Ollama) |
| Entraînement IA | Kaggle GPU T4×2 + Unsloth |
| Vidéo | Agora SDK |
| OCR | Tesseract.js |
| Auth | JWT + Passport |

## 👥 Équipe

Projet PIM 2025 — ESPRIT
.\start_ai_server.bat