"""
Service Flask : prédiction lab (rendez-vous) — utilisé par NestJS.

- POST /predict          → modèle « tier » (model.pkl) + abonnement free/plus/premium
- POST /predict-ml-api   → 2ᵉ modèle (model_ml_api.pkl), même logique que le dossier ml-api/

Copiez ml-api/model.pkl vers model_ml_api.pkl pour activer la 2ᵉ route.
"""
from pathlib import Path

from flask import Flask, request, jsonify
import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"
MODEL_ML_API_PATH = BASE_DIR / "model_ml_api.pkl"

app = Flask(__name__)

# Load models if available, otherwise run in mock mode
model = None
model_ml_api = None

if MODEL_PATH.is_file():
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"[ERROR] Failed to load model.pkl: {e}")
else:
    print(f"[INFO] model.pkl not found at {MODEL_PATH} - running in mock mode")

if MODEL_ML_API_PATH.is_file():
    try:
        model_ml_api = joblib.load(MODEL_ML_API_PATH)
    except Exception as e:
        print(f"[ERROR] Failed to load model_ml_api.pkl: {e}")
else:
    print(f"[INFO] model_ml_api.pkl not found at {MODEL_ML_API_PATH} - optional")

# Mots-clés dans la note → acceptation automatique (sans tenir compte d’un abonnement)
URGENCY_KEYWORDS = (
    "urgent",
    "urgence",
    "urgences",
    "critique",
    "immédiat",
    "immediate",
    "asap",
    "prioritaire",
    "priorité",
    "priorite",
    "grave",
    "douleur intense",
)


def _note_indique_urgence(note_lower: str) -> bool:
    return any(m in note_lower for m in URGENCY_KEYWORDS)


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "ml_predict",
            "mode": "mock" if model is None else "production",
            "models": {
                "tier": "model.pkl" if model is not None else "[MISSING] (mock)",
                "ml_api": "model_ml_api.pkl" if model_ml_api is not None else "[MISSING] (optional)",
            },
        }
    )


@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return (
            jsonify({
                "error": "Model not loaded",
                "result": "En attente",
                "subscription_tier": "free",
                "tier_score": 0,
                "mode": "mock (model.pkl missing)"
            }),
            200,
        )
    
    data = request.json or {}

    note = data.get("note", "")
    type_analyse = data.get("type_analyse", "")
    allergies = data.get("allergies", "")
    subscription_tier = data.get("subscription_tier", "free")

    note = str(note).lower().strip()
    allergies = str(allergies).strip()
    subscription_tier = str(subscription_tier).lower().strip()

    nb_allergies = 0 if allergies == "" else len(allergies.split("|"))

    tier_map = {"free": 0, "plus": 1, "premium": 2}
    tier_score = tier_map.get(subscription_tier, 0)

    df = pd.DataFrame(
        [
            {
                "note": note,
                "type_analyse": type_analyse,
                "nb_allergies": nb_allergies,
            }
        ]
    )

    pred = model.predict(df)[0]

    # Pas de forçage par abonnement : uniquement la prédiction du modèle
    result = "Acceptée automatiquement" if pred == 1 else "En attente"

    return jsonify(
        {
            "result": result,
            "subscription_tier": subscription_tier,
            "tier_score": tier_score,
        }
    )


@app.route("/predict-ml-api", methods=["POST"])
def predict_ml_api():
    """
    Comportement aligné sur ml-api/app.py (2ᵉ modèle joblib).
    """
    if model_ml_api is None:
        # Check if it's just missing, or never tried to load
        if MODEL_ML_API_PATH.is_file():
            error_msg = "Failed to load model_ml_api.pkl"
            hints = "Check file format or reinstall dependencies"
        else:
            error_msg = "model_ml_api.pkl not found"
            hints = "Copiez ml-api/model.pkl vers medaichain-backend/python/model_ml_api.pkl"
        
        return jsonify({
            "error": error_msg,
            "result": "En attente",
            "prediction": 0,
            "mode": "mock (model missing)",
            "hint": hints
        }), 200
    
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"error": "No JSON received"}), 400

        note = data.get("note", "")
        type_analyse = data.get("type_analyse", "")
        allergies = data.get("allergies", "")

        if type_analyse == "":
            return jsonify({"error": "type_analyse is required"}), 400

        note = str(note).lower().strip()
        allergies = str(allergies).strip()

        if note == "":
            return jsonify({"result": "En attente"})

        # Urgence explicite dans le texte → acceptée (indépendamment du forfait)
        if _note_indique_urgence(note):
            return jsonify(
                {
                    "result": "Acceptée automatiquement",
                    "prediction": 1,
                    "reason": "urgence_note",
                }
            )

        nb_allergies = 0
        if allergies != "":
            nb_allergies = len(allergies.split("|"))

        df = pd.DataFrame(
            [
                {
                    "note": note,
                    "type_analyse": type_analyse,
                    "nb_allergies": nb_allergies,
                }
            ]
        )

        pred = model_ml_api.predict(df)[0]
        result = "Acceptée automatiquement" if pred == 1 else "En attente"

        return jsonify({"result": result, "prediction": int(pred)})
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
