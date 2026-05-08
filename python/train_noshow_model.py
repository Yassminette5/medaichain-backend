"""
MedAIChain — Entraînement du modèle No-Show (GradientBoosting)
Dataset : Medical Appointment No Shows (Kaggle)
https://www.kaggle.com/datasets/joniarroba/noshowappointments

Ce script :
  1. Génère un dataset réaliste basé sur les distributions Kaggle
  2. Nettoie et prépare les features
  3. Entraîne un GradientBoostingClassifier avec cross-validation
  4. Sauvegarde le modèle dans noshow_model.pkl
  5. Affiche les métriques et la feature importance
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path

# ── Dépendances ──
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    accuracy_score, precision_score, recall_score, f1_score
)
import joblib


BASE_DIR = Path(__file__).resolve().parent
MODEL_OUTPUT = BASE_DIR / "noshow_model.pkl"
METADATA_OUTPUT = BASE_DIR / "noshow_model_meta.json"

# ══════════════════════════════════════════════════
#  DATASET : Générer un dataset réaliste basé sur
#  les distributions du vrai dataset Kaggle
#  (110K appointments, ~20% no-show rate)
# ══════════════════════════════════════════════════

def generate_realistic_dataset(n_samples=50000, seed=42):
    """
    Génère un dataset synthétique fidèle aux distributions du vrai dataset
    'Medical Appointment No Shows' de Kaggle.
    
    Distributions réelles du dataset Kaggle :
    - No-show rate: ~20%
    - Gender: 65% F, 35% M
    - Age: moyenne 37, std 23 (0-115)
    - Scholarship (Bolsa Família): ~10%
    - Hypertension: ~20%
    - Diabetes: ~7%
    - Alcoholism: ~3%
    - Handicap: ~2%
    - SMS_received: ~32%
    """
    np.random.seed(seed)
    
    # ── Features de base (distributions réalistes) ──
    gender = np.random.choice([0, 1], size=n_samples, p=[0.65, 0.35])  # 0=F, 1=M
    age = np.clip(np.random.normal(37, 23, n_samples).astype(int), 0, 100)
    scholarship = np.random.choice([0, 1], size=n_samples, p=[0.90, 0.10])
    hypertension = np.random.choice([0, 1], size=n_samples, p=[0.80, 0.20])
    diabetes = np.random.choice([0, 1], size=n_samples, p=[0.93, 0.07])
    alcoholism = np.random.choice([0, 1], size=n_samples, p=[0.97, 0.03])
    handicap = np.random.choice([0, 1], size=n_samples, p=[0.98, 0.02])
    sms_received = np.random.choice([0, 1], size=n_samples, p=[0.68, 0.32])
    
    # Jours d'attente entre prise de RDV et date du RDV
    days_ahead = np.clip(np.random.exponential(10, n_samples).astype(int), 0, 120)
    
    # Jour de la semaine du RDV (0=Lundi ... 6=Dimanche)
    day_of_week = np.random.choice(range(7), size=n_samples, p=[0.22, 0.22, 0.22, 0.18, 0.12, 0.03, 0.01])
    
    # Heure du RDV (7-18h)
    hour = np.random.choice(range(7, 19), size=n_samples)
    
    # Nombre de RDV passés du patient (fidélité)
    past_appointments = np.clip(np.random.exponential(3, n_samples).astype(int), 0, 30)
    
    # ── Calcul du no-show avec des corrélations réalistes ──
    # Facteurs de risque de no-show (basés sur la littérature médicale)
    base_prob = np.full(n_samples, 0.15)  # Probabilité de base ~15%
    
    # Jeunes adultes (18-30) ont plus de no-shows
    base_prob += np.where((age >= 18) & (age <= 30), 0.08, 0)
    
    # Enfants (0-5) ont moins de no-shows (parents responsables)
    base_prob -= np.where(age <= 5, 0.05, 0)
    
    # Personnes âgées (>65) ont moins de no-shows
    base_prob -= np.where(age > 65, 0.04, 0)
    
    # Scholarship (faible revenu) → plus de no-shows
    base_prob += scholarship * 0.06
    
    # SMS reçu → réduit le no-show
    base_prob -= sms_received * 0.05
    
    # Hypertension/Diabetes → patient plus assidu (suivi régulier)
    base_prob -= hypertension * 0.04
    base_prob -= diabetes * 0.03
    
    # Alcoholism → plus de no-shows
    base_prob += alcoholism * 0.10
    
    # Handicap → moins de no-shows
    base_prob -= handicap * 0.03
    
    # Plus le RDV est loin, plus de risque de no-show
    base_prob += np.clip(days_ahead / 100, 0, 0.15)
    
    # RDV le lundi → plus de no-shows (post-weekend)
    base_prob += np.where(day_of_week == 0, 0.03, 0)
    
    # RDV le vendredi → plus de no-shows
    base_prob += np.where(day_of_week == 4, 0.02, 0)
    
    # Patients fidèles (beaucoup de RDV passés) → moins de no-shows
    base_prob -= np.clip(past_appointments * 0.01, 0, 0.08)
    
    # RDV tôt le matin → plus de no-shows
    base_prob += np.where(hour <= 8, 0.03, 0)
    
    # Genre : hommes légèrement plus de no-shows
    base_prob += gender * 0.02
    
    # Clip entre 0.02 et 0.85
    base_prob = np.clip(base_prob, 0.02, 0.85)
    
    # Générer les labels
    no_show = (np.random.random(n_samples) < base_prob).astype(int)
    
    df = pd.DataFrame({
        'Gender': gender,
        'Age': age,
        'Scholarship': scholarship,
        'Hipertension': hypertension,
        'Diabetes': diabetes,
        'Alcoholism': alcoholism,
        'Handcap': handicap,
        'SMS_received': sms_received,
        'DaysAhead': days_ahead,
        'DayOfWeek': day_of_week,
        'Hour': hour,
        'PastAppointments': past_appointments,
        'NoShow': no_show
    })
    
    return df


def train_model():
    print("=" * 60)
    print("🧠 MedAIChain — Entraînement du modèle No-Show")
    print("=" * 60)
    print()
    
    # ── 1. Charger / Générer le dataset ──
    csv_path = BASE_DIR / "noshow_appointments.csv"
    
    if csv_path.is_file():
        print(f"📂 Dataset trouvé : {csv_path}")
        df = pd.read_csv(csv_path)
        # Adapter les noms de colonnes du dataset Kaggle
        if 'No-show' in df.columns:
            df['NoShow'] = (df['No-show'] == 'Yes').astype(int)
        if 'Handcap' not in df.columns and 'Handicap' in df.columns:
            df.rename(columns={'Handicap': 'Handcap'}, inplace=True)
    else:
        print("📊 Génération d'un dataset réaliste (50K échantillons)...")
        print("   Basé sur les distributions du dataset Kaggle 'No Show Appointments'")
        df = generate_realistic_dataset(n_samples=50000)
    
    print(f"   → {len(df)} échantillons chargés")
    print(f"   → Taux de no-show : {df['NoShow'].mean():.1%}")
    print()
    
    # ── 2. Préparer les features ──
    feature_cols = [
        'Gender', 'Age', 'Scholarship', 'Hipertension', 
        'Diabetes', 'Alcoholism', 'Handcap', 'SMS_received'
    ]
    
    # Ajouter les features supplémentaires si disponibles
    for col in ['DaysAhead', 'DayOfWeek', 'Hour', 'PastAppointments']:
        if col in df.columns:
            feature_cols.append(col)
    
    # Garder uniquement les colonnes existantes
    feature_cols = [c for c in feature_cols if c in df.columns]
    
    X = df[feature_cols].copy()
    y = df['NoShow'].copy()
    
    # Encoder le genre si c'est du texte
    if X['Gender'].dtype == 'object':
        X['Gender'] = (X['Gender'] == 'M').astype(int)
    
    print(f"📋 Features utilisées ({len(feature_cols)}) :")
    for i, col in enumerate(feature_cols):
        print(f"   {i+1}. {col}")
    print()
    
    # ── 3. Split train/test ──
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"📐 Split : {len(X_train)} train / {len(X_test)} test")
    print(f"   Train no-show rate : {y_train.mean():.1%}")
    print(f"   Test  no-show rate : {y_test.mean():.1%}")
    print()
    
    # ── 4. Entraîner RandomForest ──
    print("🚀 Entraînement RandomForestClassifier (class_weight=balanced)...")
    
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight='balanced_subsample',
        random_state=42,
        n_jobs=-1,
    )
    
    model.fit(X_train, y_train)
    
    # ── 5. Évaluation ──
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    
    print()
    print("=" * 60)
    print("📊 RÉSULTATS")
    print("=" * 60)
    print(f"   Accuracy  : {acc:.3f}")
    print(f"   Precision : {prec:.3f}")
    print(f"   Recall    : {rec:.3f}")
    print(f"   F1-Score  : {f1:.3f}")
    print(f"   AUC-ROC   : {auc:.3f}")
    print()
    
    # Cross-validation
    print("🔄 Cross-validation (5-fold)...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc')
    print(f"   AUC-ROC moyen : {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
    print()
    
    # Feature importance
    print("📈 Feature Importance :")
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    for i, idx in enumerate(sorted_idx):
        bar = "█" * int(importances[idx] * 40)
        print(f"   {i+1}. {feature_cols[idx]:20s} {importances[idx]:.3f}  {bar}")
    print()
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    print("📋 Matrice de confusion :")
    print(f"   Vrai négatif  : {cm[0][0]:5d}  |  Faux positif : {cm[0][1]:5d}")
    print(f"   Faux négatif  : {cm[1][0]:5d}  |  Vrai positif : {cm[1][1]:5d}")
    print()
    
    # ── 6. Sauvegarder le modèle ──
    joblib.dump({
        'model': model,
        'features': feature_cols,
        'version': '1.0.0',
        'dataset': 'noshow_appointments_realistic',
        'n_samples': len(df),
        'metrics': {
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1': round(f1, 4),
            'auc_roc': round(auc, 4),
            'cv_auc_mean': round(cv_scores.mean(), 4),
        }
    }, MODEL_OUTPUT)
    
    # Sauvegarder les métadonnées
    meta = {
        'model_type': 'RandomForestClassifier',
        'version': '1.0.0',
        'features': feature_cols,
        'n_samples': len(df),
        'noshow_rate': round(df['NoShow'].mean(), 4),
        'metrics': {
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1': round(f1, 4),
            'auc_roc': round(auc, 4),
        },
        'feature_importance': {
            feature_cols[i]: round(float(importances[i]), 4)
            for i in sorted_idx
        }
    }
    with open(METADATA_OUTPUT, 'w') as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Modèle sauvegardé : {MODEL_OUTPUT}")
    print(f"✅ Métadonnées       : {METADATA_OUTPUT}")
    print(f"   Taille : {MODEL_OUTPUT.stat().st_size / 1024:.1f} KB")
    print()
    print("=" * 60)
    print("🎉 Entraînement terminé avec succès !")
    print("=" * 60)


if __name__ == "__main__":
    train_model()
