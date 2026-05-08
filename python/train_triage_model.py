import pandas as pd
import numpy as np
import json
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "triage_model.pkl"
META_PATH = BASE_DIR / "triage_model_meta.json"

def generate_triage_data(n_samples=20000):
    np.random.seed(42)
    
    # Features
    age = np.random.randint(1, 95, n_samples)
    gender = np.random.randint(0, 2, n_samples) # 0: Female, 1: Male
    heart_rate = np.random.normal(80, 20, n_samples).astype(int)
    systolic_bp = np.random.normal(120, 25, n_samples).astype(int)
    temperature = np.random.normal(37.0, 0.8, n_samples)
    oxygen_sat = np.random.normal(97, 3, n_samples).astype(int)
    oxygen_sat = np.clip(oxygen_sat, 80, 100)
    
    comorbidities = np.random.poisson(0.8, n_samples)
    pain_level = np.random.randint(0, 11, n_samples)
    
    # Target rules (approximated)
    # Classes: 0: Routine (Green), 1: Urgent (Yellow), 2: Critical (Red)
    triage_class = np.zeros(n_samples, dtype=int)
    
    for i in range(n_samples):
        # Critical rules (Red)
        if (oxygen_sat[i] < 90 or 
            systolic_bp[i] < 90 or 
            systolic_bp[i] > 180 or 
            heart_rate[i] > 130 or 
            heart_rate[i] < 45 or
            (temperature[i] > 39.5 and age[i] > 65) or
            pain_level[i] >= 9):
            triage_class[i] = 2
        # Urgent rules (Yellow)
        elif (oxygen_sat[i] < 95 or 
              systolic_bp[i] > 140 or 
              heart_rate[i] > 100 or 
              temperature[i] > 38.5 or
              pain_level[i] >= 6 or
              (comorbidities[i] >= 2 and age[i] > 60)):
            triage_class[i] = 1
        # Routine rules (Green)
        else:
            triage_class[i] = 0

    # Introduce some noise so it's not purely rule-based
    noise_indices = np.random.choice(n_samples, int(n_samples * 0.1), replace=False)
    triage_class[noise_indices] = np.random.randint(0, 3, len(noise_indices))

    df = pd.DataFrame({
        'Age': age,
        'Gender': gender,
        'HeartRate': heart_rate,
        'SystolicBP': systolic_bp,
        'Temperature': temperature,
        'OxygenSat': oxygen_sat,
        'Comorbidities': comorbidities,
        'PainLevel': pain_level,
        'TriageLevel': triage_class
    })
    
    return df

def main():
    print("=" * 60)
    print("🏥 MedAIChain — Entraînement du modèle de Triage IA")
    print("=" * 60)
    
    print("1. Génération du dataset réaliste...")
    df = generate_triage_data(30000)
    
    X = df.drop('TriageLevel', axis=1)
    y = df['TriageLevel']
    
    print(f"   Distribution des classes :")
    print(f"   - Routine (0)  : {(y == 0).sum()}")
    print(f"   - Urgent (1)   : {(y == 1).sum()}")
    print(f"   - Critique (2) : {(y == 2).sum()}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("\n2. Entraînement du RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    print("\n3. Évaluation du modèle...")
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print(f"\nAccuracy : {acc:.3f}")
    print("\nRapport de classification :")
    print(classification_report(y_test, y_pred, target_names=['Routine', 'Urgent', 'Critique']))
    
    # Feature importance
    importances = model.feature_importances_
    features = X.columns
    feat_imp = pd.Series(importances, index=features).sort_values(ascending=False)
    
    print("\nImportance des variables :")
    for k, v in feat_imp.items():
        bar = "█" * int(v * 40)
        print(f"   {k:15s} {v:.3f}  {bar}")
        
    print("\n4. Sauvegarde du modèle...")
    model_data = {
        'model': model,
        'features': list(X.columns),
        'version': '1.0.0',
        'metrics': {
            'accuracy': acc
        }
    }
    
    joblib.dump(model_data, MODEL_PATH)
    
    meta = {
        'model_type': 'RandomForestClassifier',
        'version': '1.0.0',
        'features': list(X.columns),
        'feature_importance': feat_imp.to_dict(),
        'n_samples': len(df),
        'metrics': {'accuracy': acc}
    }
    
    with open(META_PATH, 'w') as f:
        json.dump(meta, f, indent=4)
        
    print(f"✅ Modèle sauvegardé : {MODEL_PATH.name}")
    print("=" * 60)

if __name__ == "__main__":
    main()
