"""
MedAIChain — Service Flask de prédiction No-Show (RandomForest)
Port : 5005

Routes :
  GET  /health              → État du service + métriques du modèle
  POST /predict             → Prédiction no-show pour un RDV
  POST /predict/adherence   → Prédiction adhérence au traitement
  POST /predict/batch       → Prédiction batch (plusieurs patients)
  POST /predict/triage      → Triage IA (prioritisation d'urgence)

Le modèle No-Show est entraîné via train_noshow_model.py
Le modèle Triage est entraîné via train_triage_model.py
"""

from pathlib import Path
import sys
import os
import json
import traceback

# ── Auto-install des dépendances ──
for pkg in ['flask', 'joblib', 'pandas', 'numpy']:
    try:
        __import__(pkg)
    except ImportError:
        os.system(f"{sys.executable} -m pip install {pkg} --quiet")

from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "noshow_model.pkl"
META_PATH = BASE_DIR / "noshow_model_meta.json"

TRIAGE_MODEL_PATH = BASE_DIR / "triage_model.pkl"
TRIAGE_META_PATH = BASE_DIR / "triage_model_meta.json"

DISEASE_MODEL_PATH = BASE_DIR / "disease_model.pkl"
DISEASE_META_PATH = BASE_DIR / "disease_model_meta.json"

NLP_MODEL_PATH = BASE_DIR / "nlp_diagnosis_model.pkl"

app = Flask(__name__)

# ── Chargement du modèle ──
model_data = None
model = None
feature_cols = None
model_meta = None

if MODEL_PATH.is_file():
    try:
        model_data = joblib.load(MODEL_PATH)
        model = model_data['model']
        feature_cols = model_data['features']
        print(f"✅ Modèle No-Show chargé : {MODEL_PATH.name}")
        print(f"   Version  : {model_data.get('version', '?')}")
        print(f"   Features : {feature_cols}")
        print(f"   Accuracy : {model_data.get('metrics', {}).get('accuracy', '?')}")
        print(f"   AUC-ROC  : {model_data.get('metrics', {}).get('auc_roc', '?')}")
    except Exception as e:
        print(f"❌ Erreur chargement modèle : {e}")
else:
    print(f"⚠️  Modèle non trouvé : {MODEL_PATH}")
    print(f"   → Lancez d'abord : python train_noshow_model.py")

if META_PATH.is_file():
    try:
        with open(META_PATH) as f:
            model_meta = json.load(f)
    except Exception:
        pass

# ── Chargement du modèle TRIAGE ──
triage_model_data = None
triage_model = None
triage_features = None

if TRIAGE_MODEL_PATH.is_file():
    try:
        triage_model_data = joblib.load(TRIAGE_MODEL_PATH)
        triage_model = triage_model_data['model']
        triage_features = triage_model_data['features']
        print(f"✅ Modèle Triage chargé : {TRIAGE_MODEL_PATH.name}")
    except Exception as e:
        print(f"❌ Erreur chargement modèle Triage : {e}")

# ── Chargement du modèle MALADIES (DISEASE) ──
disease_model_data = None
disease_model = None

if DISEASE_MODEL_PATH.is_file():
    try:
        disease_model_data = joblib.load(DISEASE_MODEL_PATH)
        disease_model = disease_model_data['model']
        print(f"✅ Modèle Disease chargé : {DISEASE_MODEL_PATH.name}")
    except Exception as e:
        print(f"❌ Erreur chargement modèle Disease : {e}")

# ── Chargement du modèle NLP ──
nlp_model = None
if NLP_MODEL_PATH.is_file():
    try:
        nlp_model = joblib.load(NLP_MODEL_PATH)
        print(f"✅ Modèle NLP chargé : {NLP_MODEL_PATH.name}")
    except Exception as e:
        print(f"❌ Erreur chargement modèle NLP : {e}")


def get_risk_level(probability):
    """Convertit une probabilité en niveau de risque."""
    if probability >= 60:
        return 'élevé', 'red'
    elif probability >= 35:
        return 'modéré', 'orange'
    else:
        return 'faible', 'green'


def get_recommendations(prob, features_dict):
    """Génère des recommandations cliniques détaillées et professionnelles."""
    recommendations = []
    risk_factors = []
    
    age = features_dict.get('Age', 30)
    sms = features_dict.get('SMS_received', 0)
    days = features_dict.get('DaysAhead', 0)
    past = features_dict.get('PastAppointments', 0)
    
    # ═══ RECOMMANDATIONS SELON LE NIVEAU DE RISQUE ═══
    if prob >= 60:
        recommendations.append('🔴 PRIORITÉ HAUTE — Contacter le patient par téléphone pour confirmer sa venue')
        if sms == 0:
            recommendations.append('📱 Programmer un SMS automatique de rappel 48h et 24h avant le RDV')
            risk_factors.append('Aucun SMS de rappel programmé')
        recommendations.append('📋 Préparer un créneau de remplacement en cas d\'absence')
        if past == 0:
            recommendations.append('👤 Nouveau patient — prévoir un accueil personnalisé pour favoriser l\'adhérence')
    elif prob >= 35:
        recommendations.append('🟡 RISQUE MODÉRÉ — Envoyer un SMS de rappel 24h avant le rendez-vous')
        if sms == 0:
            recommendations.append('📱 Activer le rappel SMS pour ce patient')
        recommendations.append('📊 Surveiller l\'historique de présence lors des prochains RDV')
    else:
        recommendations.append('🟢 Patient fiable — Maintenir le suivi standard')
        if past >= 5:
            recommendations.append('⭐ Patient fidèle avec ' + str(past) + ' RDV honorés — envisager un créneau préférentiel')
    
    # ═══ FACTEURS DE RISQUE CLINIQUES ═══
    if age >= 18 and age <= 25:
        risk_factors.append(f'Jeune adulte ({age} ans) — tranche 18-25 ans à risque élevé de no-show')
    elif age >= 26 and age <= 30:
        risk_factors.append(f'Adulte jeune ({age} ans) — facteur démographique modéré')
    elif age > 65:
        risk_factors.append(f'Patient âgé ({age} ans) — mobilité réduite, prévoir accompagnement')
        recommendations.append('🚗 Vérifier les besoins de transport du patient')
    elif age <= 5:
        risk_factors.append(f'Nourrisson/enfant ({age} ans) — dépend du parent/tuteur')
    
    if features_dict.get('Scholarship', 0) == 1:
        risk_factors.append('Bénéficiaire d\'aide sociale — barrières socio-économiques possibles')
        recommendations.append('💊 Proposer des alternatives génériques si coût du traitement élevé')
    
    if features_dict.get('Alcoholism', 0) == 1:
        risk_factors.append('Alcoolisme déclaré — facteur de non-adhérence significatif')
        recommendations.append('🩺 Orientation vers un suivi addictologique recommandée')
    
    if features_dict.get('Hipertension', 0) == 1:
        risk_factors.append('Hypertension artérielle — suivi tensionnel régulier nécessaire')
        
    if features_dict.get('Diabetes', 0) == 1:
        risk_factors.append('Diabète — contrôle glycémique et suivi podologique essentiels')
    
    if features_dict.get('Hipertension', 0) == 1 and features_dict.get('Diabetes', 0) == 1:
        recommendations.append('⚕️ Patient poly-pathologique — coordonner le suivi multidisciplinaire')
    
    if features_dict.get('Handcap', 0) == 1:
        risk_factors.append('Situation de handicap — vérifier accessibilité PMR du cabinet')
        recommendations.append('♿ S\'assurer de l\'accessibilité du lieu de consultation')
    
    if days > 45:
        risk_factors.append(f'RDV dans {days} jours — risque d\'oubli très élevé')
        recommendations.append(f'📅 Programmer un rappel intermédiaire à J-14 et J-3')
    elif days > 20:
        risk_factors.append(f'RDV dans {days} jours — délai important, risque d\'oubli')
        recommendations.append('📅 Rappel SMS recommandé à J-7')
    
    if past == 0:
        risk_factors.append('Aucun historique de RDV — premier contact avec la clinique')
    elif past >= 8:
        risk_factors.append(f'Patient régulier ({past} RDV passés) — bonne adhérence historique')
    
    if not risk_factors:
        risk_factors.append('Profil standard — aucun facteur de risque majeur identifié')
    
    return recommendations, risk_factors


# ══════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "noshow_predict",
        "model_loaded": model is not None,
        "model_version": model_data.get('version', '?') if model_data else None,
        "features": feature_cols,
        "metrics": model_data.get('metrics', {}) if model_data else {},
        "meta": model_meta,
        "triage_model_loaded": triage_model is not None,
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Prédiction no-show pour un rendez-vous.
    
    Body JSON :
    {
        "gender": "M" ou "F" (ou 0/1),
        "age": 35,
        "scholarship": 0,
        "hipertension": 0,
        "diabetes": 0,
        "alcoholism": 0,
        "handcap": 0,
        "sms_received": 1,
        "days_ahead": 7,        // optionnel
        "day_of_week": 2,       // optionnel (0=Lundi)
        "hour": 10,             // optionnel
        "past_appointments": 3  // optionnel
    }
    """
    if model is None:
        return jsonify({
            "error": "Modèle non chargé",
            "hint": "Lancez : python train_noshow_model.py",
            "success": False,
        }), 503
    
    try:
        data = request.json or {}
        
        # Normaliser le genre
        gender = data.get('gender', 'M')
        if isinstance(gender, str):
            gender = 1 if gender.upper() in ('M', 'MALE', 'HOMME') else 0
        
        # Construire le dictionnaire de features
        features_dict = {
            'Gender': int(gender),
            'Age': int(data.get('age', 30)),
            'Scholarship': int(data.get('scholarship', 0)),
            'Hipertension': int(data.get('hipertension', 0)),
            'Diabetes': int(data.get('diabetes', 0)),
            'Alcoholism': int(data.get('alcoholism', 0)),
            'Handcap': int(data.get('handcap', 0)),
            'SMS_received': int(data.get('sms_received', 1)),
        }
        
        # Features optionnelles
        if 'DaysAhead' in feature_cols:
            features_dict['DaysAhead'] = int(data.get('days_ahead', data.get('DaysAhead', 7)))
        if 'DayOfWeek' in feature_cols:
            features_dict['DayOfWeek'] = int(data.get('day_of_week', data.get('DayOfWeek', 2)))
        if 'Hour' in feature_cols:
            features_dict['Hour'] = int(data.get('hour', data.get('Hour', 10)))
        if 'PastAppointments' in feature_cols:
            features_dict['PastAppointments'] = int(data.get('past_appointments', data.get('PastAppointments', 0)))
        
        # Construire le DataFrame avec les colonnes dans le bon ordre
        row = {col: features_dict.get(col, 0) for col in feature_cols}
        df = pd.DataFrame([row])
        
        # Prédiction
        proba = model.predict_proba(df)[0]
        no_show_prob = round(float(proba[1]) * 100, 1)  # % de no-show
        
        risk_level, risk_color = get_risk_level(no_show_prob)
        recommendations, risk_factors = get_recommendations(no_show_prob, features_dict)
        
        return jsonify({
            "success": True,
            "noShowProbability": no_show_prob,
            "riskLevel": risk_level,
            "riskColor": risk_color,
            "recommendations": recommendations,
            "riskFactors": risk_factors,
            "confidence": round(max(no_show_prob, 100 - no_show_prob), 1),
            "model": {
                "type": "RandomForest",
                "version": model_data.get('version', '1.0.0'),
                "auc_roc": model_data.get('metrics', {}).get('auc_roc', 0),
            }
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/predict/adherence", methods=["POST"])
def predict_adherence():
    """
    Prédiction d'adhérence au traitement.
    Utilise le même modèle mais transforme la sortie
    en score d'adhérence (inverse du no-show).
    
    Body JSON :
    {
        "Age": 45,
        "Gender": "Male",
        "Dosage_mg": 200,
        "Income": 3000,
        "Comorbidities_Count": 2
    }
    """
    if model is None:
        return jsonify({
            "error": "Modèle non chargé",
            "success": False,
        }), 503
    
    try:
        data = request.json or {}
        
        age = int(data.get('Age', 35))
        gender_str = str(data.get('Gender', 'Male'))
        gender = 1 if gender_str.lower() in ('male', 'm', 'homme') else 0
        dosage = int(data.get('Dosage_mg', 100))
        income = int(data.get('Income', 3000))
        comorbidities = int(data.get('Comorbidities_Count', 0))
        
        # Mapper vers les features du modèle
        features_dict = {
            'Gender': gender,
            'Age': age,
            'Scholarship': 1 if income < 2000 else 0,
            'Hipertension': 1 if comorbidities >= 1 else 0,
            'Diabetes': 1 if comorbidities >= 2 else 0,
            'Alcoholism': 0,
            'Handcap': 0,
            'SMS_received': 1,
        }
        
        # Features optionnelles
        if 'DaysAhead' in feature_cols:
            features_dict['DaysAhead'] = 7
        if 'DayOfWeek' in feature_cols:
            features_dict['DayOfWeek'] = 2
        if 'Hour' in feature_cols:
            features_dict['Hour'] = 10
        if 'PastAppointments' in feature_cols:
            features_dict['PastAppointments'] = max(0, 5 - comorbidities)
        
        row = {col: features_dict.get(col, 0) for col in feature_cols}
        df = pd.DataFrame([row])
        
        proba = model.predict_proba(df)[0]
        adherence_prob = round(float(proba[0]) * 100, 1)  # Adhérence = 1 - no_show
        no_show_prob = round(float(proba[1]) * 100, 1)
        
        # Ajuster avec les facteurs contextuels
        dosage_penalty = min(10, max(0, (dosage - 200) / 50))
        income_bonus = min(5, max(0, (income - 2000) / 1000))
        adjusted_adherence = round(min(98, max(5, adherence_prob - dosage_penalty + income_bonus)), 1)
        
        # Déterminer le statut de risque
        if adjusted_adherence >= 65:
            risk_status = "ADHERENT_STABLE"
        elif adjusted_adherence >= 40:
            risk_status = "RISQUE_MODÉRÉ"
        else:
            risk_status = "RISQUE_ELEVÉ_ABANDON"
        
        # Facteurs de risque cliniques détaillés
        risk_factors = []
        if age > 60:
            risk_factors.append(f"Âge avancé ({age} ans) — observance thérapeutique à surveiller")
        if age < 25:
            risk_factors.append(f"Patient jeune ({age} ans) — risque d'interruption de traitement")
        if comorbidities >= 3:
            risk_factors.append(f"{comorbidities} comorbidités — polypathologie complexe")
        elif comorbidities >= 2:
            risk_factors.append(f"{comorbidities} comorbidités détectées — suivi renforcé")
        if dosage > 300:
            risk_factors.append(f"Traitement lourd ({dosage}mg/jour) — risque d'effets secondaires")
        elif dosage > 200:
            risk_factors.append(f"Dosage élevé ({dosage}mg) — surveillance des effets indésirables")
        if income < 2000:
            risk_factors.append("Précarité économique — accès aux médicaments potentiellement limité")
        elif income < 2500:
            risk_factors.append("Revenu modeste — vérifier la couverture médicale")
        if not risk_factors:
            risk_factors.append("Profil clinique favorable — aucun facteur de risque identifié")
        
        # Recommandations cliniques professionnelles
        if risk_status == "RISQUE_ELEVÉ_ABANDON":
            recommendation = ("🔴 ALERTE — Risque élevé d'abandon thérapeutique. "
                             "Actions recommandées : 1) Appel téléphonique immédiat, "
                             "2) Évaluer les barrières à l'observance, "
                             "3) Proposer un suivi rapproché (hebdomadaire)")
        elif risk_status == "RISQUE_MODÉRÉ":
            recommendation = ("🟡 VIGILANCE — Envoyer un SMS de rappel préventif. "
                             "Planifier un entretien motivationnel lors de la prochaine consultation. "
                             "Vérifier la compréhension du schéma thérapeutique")
        else:
            recommendation = ("🟢 STABLE — Patient adhérent au traitement. "
                             "Maintenir le suivi standard. "
                             "Féliciter le patient pour sa régularité lors du prochain RDV")
        
        return jsonify({
            "success": True,
            "adherence_probability": adjusted_adherence,
            "risk_status": risk_status,
            "risk_factors": risk_factors,
            "recommendation": recommendation,
            "confidence": round(max(adjusted_adherence, 100 - adjusted_adherence), 1),
            "model": "RandomForest v1.0.0"
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """
    Prédiction batch pour plusieurs patients.
    Body JSON : { "patients": [ { ... }, { ... } ] }
    """
    if model is None:
        return jsonify({"error": "Modèle non chargé", "success": False}), 503
    
    try:
        data = request.json or {}
        patients = data.get('patients', [])
        
        results = []
        for p in patients:
            gender = p.get('gender', 'M')
            if isinstance(gender, str):
                gender = 1 if gender.upper() in ('M', 'MALE') else 0
            
            features_dict = {
                'Gender': int(gender),
                'Age': int(p.get('age', 30)),
                'Scholarship': int(p.get('scholarship', 0)),
                'Hipertension': int(p.get('hipertension', 0)),
                'Diabetes': int(p.get('diabetes', 0)),
                'Alcoholism': int(p.get('alcoholism', 0)),
                'Handcap': int(p.get('handcap', 0)),
                'SMS_received': int(p.get('sms_received', 1)),
            }
            
            for extra in ['DaysAhead', 'DayOfWeek', 'Hour', 'PastAppointments']:
                if extra in feature_cols:
                    features_dict[extra] = int(p.get(extra.lower(), p.get(extra, 0)))
            
            row = {col: features_dict.get(col, 0) for col in feature_cols}
            df = pd.DataFrame([row])
            
            proba = model.predict_proba(df)[0]
            no_show_prob = round(float(proba[1]) * 100, 1)
            risk_level, risk_color = get_risk_level(no_show_prob)
            
            results.append({
                "patientId": p.get('patientId', None),
                "noShowProbability": no_show_prob,
                "riskLevel": risk_level,
                "riskColor": risk_color,
            })
        
        return jsonify({"success": True, "results": results})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/predict/triage", methods=["POST"])
def predict_triage():
    """
    Triage IA - Prédiction du niveau d'urgence.
    Body JSON :
    {
        "Age": 45,
        "Gender": "M",
        "HeartRate": 95,
        "SystolicBP": 130,
        "Temperature": 37.5,
        "OxygenSat": 98,
        "Comorbidities": 1,
        "PainLevel": 4
    }
    """
    if triage_model is None:
        return jsonify({"error": "Modèle Triage non chargé", "success": False}), 503
    
    try:
        data = request.json or {}
        
        # Valeurs par défaut si non fournies
        age = int(data.get('Age', 35))
        gender_str = str(data.get('Gender', 'F'))
        gender = 1 if gender_str.upper() in ('M', 'MALE', 'HOMME') else 0
        heart_rate = float(data.get('HeartRate', 80))
        systolic_bp = float(data.get('SystolicBP', 120))
        temperature = float(data.get('Temperature', 37.0))
        oxygen_sat = float(data.get('OxygenSat', 98))
        comorbidities = int(data.get('Comorbidities', 0))
        pain_level = int(data.get('PainLevel', 2))
        
        row = {
            'Age': age,
            'Gender': gender,
            'HeartRate': heart_rate,
            'SystolicBP': systolic_bp,
            'Temperature': temperature,
            'OxygenSat': oxygen_sat,
            'Comorbidities': comorbidities,
            'PainLevel': pain_level
        }
        
        df = pd.DataFrame([row])
        
        # Prédiction (0: Routine, 1: Urgent, 2: Critique)
        pred_class = int(triage_model.predict(df)[0])
        probas = triage_model.predict_proba(df)[0]
        confidence = float(probas[pred_class]) * 100
        
        # Mappage des résultats
        if pred_class == 2:
            status = 'CRITIQUE'
            color = 'red'
            recommendation = '🔴 URGENCE IMMÉDIATE — Prise en charge prioritaire requise (priorité 1)'
        elif pred_class == 1:
            status = 'URGENT'
            color = 'orange'
            recommendation = '🟡 SOINS URGENTS — Faire patienter sous surveillance (priorité 2)'
        else:
            status = 'ROUTINE'
            color = 'green'
            recommendation = '🟢 ROUTINE — Suivre l\'ordre normal d\'arrivée (priorité 3)'
            
        return jsonify({
            "success": True,
            "triage_class": pred_class,
            "triage_status": status,
            "color": color,
            "confidence": round(confidence, 1),
            "recommendation": recommendation,
            "probabilities": {
                "routine": round(float(probas[0])*100, 1),
                "urgent": round(float(probas[1])*100, 1) if len(probas)>1 else 0,
                "critique": round(float(probas[2])*100, 1) if len(probas)>2 else 0
            }
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/predict/disease", methods=["POST"])
def predict_disease():
    """
    Détection Précoce de Maladies (Heart Risk / Diabetes)
    Body JSON :
    { "Age": 55, "Gender": "M", "BMI": 31, "SystolicBP": 140, "Glucose": 110, "Cholesterol": 210, "Smoking": 1 }
    """
    if disease_model is None:
        return jsonify({"error": "Modèle Disease non chargé", "success": False}), 503
        
    try:
        data = request.json or {}
        
        # Valeurs par défaut sécurisées
        age = int(data.get('Age', 40))
        gender_str = str(data.get('Gender', 'F'))
        gender = 1 if gender_str.upper() in ('M', 'MALE', 'HOMME') else 0
        bmi = float(data.get('BMI', 25.0))
        systolic_bp = float(data.get('SystolicBP', 120))
        glucose = float(data.get('Glucose', 90))
        cholesterol = float(data.get('Cholesterol', 190))
        smoking = int(data.get('Smoking', 0))
        
        df = pd.DataFrame([{
            'Age': age, 'Gender': gender, 'BMI': bmi, 'SystolicBP': systolic_bp,
            'Glucose': glucose, 'Cholesterol': cholesterol, 'Smoking': smoking
        }])
        
        pred_class = int(disease_model.predict(df)[0])
        probas = disease_model.predict_proba(df)[0]
        confidence = float(probas[pred_class]) * 100
        
        # === Génération des Explications (Explainable AI) ===
        explanations = []
        if pred_class == 2:
            status = 'RISQUE_CARDIOVASCULAIRE'
            label = '❤️ Risque Cardiaque Détecté'
            color = 'red'
            if systolic_bp > 140: explanations.append(f"Tension systolique élevée ({systolic_bp} mmHg)")
            if cholesterol > 240: explanations.append(f"Cholestérol critique ({cholesterol} mg/dL)")
            if smoking == 1: explanations.append("Tabagisme actif")
            if age > 55: explanations.append(f"Âge à risque ({age} ans)")
            if len(explanations) == 0: explanations.append("Combinaison de facteurs de risque identifiés par l'IA")
        elif pred_class == 1:
            status = 'RISQUE_DIABETE'
            label = '🩸 Risque Diabétique (Pré-diabète)'
            color = 'orange'
            if glucose > 110: explanations.append(f"Glycémie anormale ({glucose} mg/dL)")
            if bmi > 30: explanations.append(f"IMC élevé ({bmi} - Obésité)")
            if age > 45: explanations.append(f"Âge ({age} ans)")
            if len(explanations) == 0: explanations.append("Signes précurseurs détectés dans le profil clinique")
        else:
            status = 'SAIN'
            label = '✅ Aucun risque majeur détecté'
            color = 'green'
            if bmi < 25 and systolic_bp < 120: explanations.append("Constantes physiologiques excellentes")
            else: explanations.append("Constantes dans la norme")
            
        return jsonify({
            "success": True,
            "disease_class": pred_class,
            "status": status,
            "label": label,
            "color": color,
            "confidence": round(confidence, 1),
            "explanations": explanations
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/predict/nlp", methods=["POST"])
def predict_nlp():
    """
    Pré-Diagnostic basé sur NLP des symptômes
    Body JSON : { "symptoms": "J'ai mal au ventre et j'ai envie de vomir" }
    """
    if nlp_model is None:
        return jsonify({"error": "Modèle NLP non chargé", "success": False}), 503
        
    try:
        data = request.json or {}
        symptoms = data.get('symptoms', '').strip()
        
        if not symptoms or len(symptoms) < 5:
            return jsonify({
                "success": True,
                "diagnosis": "Description insuffisante",
                "color": "green",
                "confidence": 0
            })
            
        import re
        clean_symptoms = re.sub(r'[^\w\s]', '', symptoms.lower())
        
        # Prédiction
        pred = nlp_model.predict([clean_symptoms])[0]
        probas = nlp_model.predict_proba([clean_symptoms])[0]
        max_proba = float(max(probas)) * 100
        
        # Mapping des directives cliniques détaillées (12 Catégories Professionnelles)
        clinical_guidelines = {
            "Urgence Cardiovasculaire (Infarctus)": {
                "color": "red",
                "triage": "🚨 URGENCE ABSOLUE - Accès immédiat (Salle de Déchocage)",
                "preparation": "Préparer ECG 12 dérivations, chariot d'urgence, défibrillateur, voie veineuse, oxygène.",
                "action_button": "CODE ROUGE"
            },
            "Crise d'asthme sévère": {
                "color": "red",
                "triage": "🚨 URGENCE RESPIRATOIRE - Accès prioritaire (Salle de Déchocage / Aérosol)",
                "preparation": "Préparer B2-mimétiques en nébulisation (Salbutamol), oxygénothérapie, corticoïdes IV.",
                "action_button": "AÉROSOL IMMÉDIAT"
            },
            "Colique néphrétique": {
                "color": "orange",
                "triage": "⚠️ URGENCE DOULOUREUSE - Priorité Traitement (Box d'examen)",
                "preparation": "Préparer antalgiques (AINS), bandelette urinaire, antispasmodiques. Écho voies urinaires.",
                "action_button": "VOIE VEINEUSE"
            },
            "Appendicite aiguë": {
                "color": "orange",
                "triage": "⚠️ URGENCE CHIRURGICALE - Priorité Consultation (Salle d'examen 1)",
                "preparation": "Préparer bon pour échographie abdominale / scanner, bilan sanguin en urgence (NFS, CRP), patient à jeun.",
                "action_button": "A JEUN / ÉCHO"
            },
            "Réaction Allergique": {
                "color": "orange",
                "triage": "⚠️ PRIORITÉ - Surveillance immédiate (Salle d'attente sous observation étroite)",
                "preparation": "Préparer chariot avec adrénaline (EpiPen), corticoïdes IV, et antihistaminiques.",
                "action_button": "OBSERVATION"
            },
            "Traumatisme / Blessure": {
                "color": "orange",
                "triage": "⚠️ PRIORITÉ TRAUMA - Immobilisation (Box de Petite Chirurgie)",
                "preparation": "Préparer matériel de suture, bandes, attelles, bons de radiologie selon la zone.",
                "action_button": "RADIO / SUTURE"
            },
            "Trouble Vestibulaire / Vertiges": {
                "color": "orange",
                "triage": "🟡 PRIORITÉ MINEURE - Aide au déplacement (Risque de chute)",
                "preparation": "Préparer fauteuil roulant, tensiomètre, marteau à réflexes.",
                "action_button": "ACCOMPAGNER"
            },
            "Gastro-entérite aiguë": {
                "color": "green",
                "triage": "🟢 ROUTINE - Salle d'attente générale (Isolement digestif conseillé)",
                "preparation": "Préparer solution de réhydratation, antiémétiques, anti-diarrhéiques.",
                "action_button": "RÉHYDRATATION"
            },
            "Syndrome Grippal / Viral": {
                "color": "green",
                "triage": "🟢 ROUTINE - Salle d'attente générale (Zone isolement si toux, masque obligatoire)",
                "preparation": "Préparer thermomètre, oxymètre, test rapide COVID/Grippe.",
                "action_button": "TEST RAPIDE"
            },
            "Infection Urinaire": {
                "color": "green",
                "triage": "🟢 ROUTINE - Salle d'attente générale",
                "preparation": "Préparer flacon stérile pour ECBU, bandelettes urinaires (BU).",
                "action_button": "BANDELETTE"
            },
            "Infection ORL": {
                "color": "green",
                "triage": "🟢 ROUTINE - Salle d'attente générale",
                "preparation": "Préparer abaisse-langue, otoscope, test de diagnostic rapide angine à streptocoque.",
                "action_button": "EXAMEN ORL"
            },
            "Symptômes non spécifiques": {
                "color": "green",
                "triage": "📋 ÉVALUATION GLOBALE - Entretien médical requis",
                "preparation": "Symptômes atypiques ou information insuffisante. Prévoir une anamnèse détaillée par le médecin.",
                "action_button": "INTERROGER"
            }
        }
        
        # Si le modèle n'est pas très sûr, on bascule sur "Non Spécifique"
        if max_proba < 10.0:
            pred = "Symptômes non spécifiques"
            
        guideline = clinical_guidelines.get(pred, {
            "color": "green",
            "triage": "🟢 ROUTINE - Salle d'attente générale",
            "preparation": "Consultation médicale standard.",
            "action_button": "ROUTINE"
        })
            
        return jsonify({
            "success": True,
            "diagnosis": pred,
            "color": guideline["color"],
            "triage": guideline["triage"],
            "preparation": guideline["preparation"],
            "action_button": guideline["action_button"],
            "confidence": round(max_proba, 1)
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    print()
    print("=" * 55)
    print("🏥 MedAIChain — Service de Prédiction No-Show")
    print(f"   Modèle : {'✅ Chargé' if model else '❌ Non trouvé'}")
    print(f"   Port   : 5005")
    print("=" * 55)
    print()
    app.run(host="0.0.0.0", port=5005, debug=False)
