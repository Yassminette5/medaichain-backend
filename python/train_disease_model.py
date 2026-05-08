import pandas as pd
import numpy as np
import json
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "disease_model.pkl"
META_PATH = BASE_DIR / "disease_model_meta.json"

def generate_disease_data(n_samples=25000):
    np.random.seed(42)
    
    # Features
    age = np.random.randint(20, 90, n_samples)
    gender = np.random.randint(0, 2, n_samples)  # 0: F, 1: M
    bmi = np.random.normal(27, 5, n_samples).round(1)
    systolic_bp = np.random.normal(125, 20, n_samples).astype(int)
    glucose = np.random.normal(100, 30, n_samples).astype(int)
    cholesterol = np.random.normal(200, 40, n_samples).astype(int)
    smoking = np.random.choice([0, 1], n_samples, p=[0.8, 0.2])
    
    # Target: 0: Healthy, 1: Diabetes Risk, 2: Heart Risk
    disease_class = np.zeros(n_samples, dtype=int)
    
    for i in range(n_samples):
        # High Heart Risk (2)
        if (systolic_bp[i] > 160 or cholesterol[i] > 260) and (age[i] > 50 or smoking[i] == 1):
            disease_class[i] = 2
        # Diabetes Risk (1)
        elif glucose[i] > 125 or (bmi[i] > 32 and age[i] > 40):
            disease_class[i] = 1
            
    # Add noise
    noise_idx = np.random.choice(n_samples, int(n_samples * 0.1), replace=False)
    disease_class[noise_idx] = np.random.randint(0, 3, len(noise_idx))
    
    df = pd.DataFrame({
        'Age': age,
        'Gender': gender,
        'BMI': bmi,
        'SystolicBP': systolic_bp,
        'Glucose': glucose,
        'Cholesterol': cholesterol,
        'Smoking': smoking,
        'DiseaseRisk': disease_class
    })
    return df

def main():
    print("=" * 60)
    print("🏥 MedAIChain — Entraînement du modèle de Détection Maladie")
    print("=" * 60)
    
    df = generate_disease_data()
    X = df.drop('DiseaseRisk', axis=1)
    y = df['DiseaseRisk']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=150, max_depth=10, class_weight='balanced', random_state=42)
    model.fit(X_train, y_train)
    
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"Accuracy : {acc:.3f}")
    
    joblib.dump({'model': model, 'features': list(X.columns)}, MODEL_PATH)
    
    with open(META_PATH, 'w') as f:
        json.dump({'model_type': 'RandomForest', 'metrics': {'accuracy': acc}}, f)
        
    print("✅ Modèle de détection de maladies sauvegardé !")

if __name__ == "__main__":
    main()
