from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

model = joblib.load('model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    note = data.get('note', '')
    type_analyse = data.get('type_analyse', '')
    allergies = data.get('allergies', '')
    subscription_tier = data.get('subscription_tier', 'free')  # free | plus | premium

    note = str(note).lower().strip()
    allergies = str(allergies).strip()
    subscription_tier = str(subscription_tier).lower().strip()
    
    nb_allergies = 0 if allergies == '' else len(allergies.split('|'))

    # ── Mapping du tier en score numérique pour le modèle ──
    # premium est déjà géré côté NestJS (auto-accepté), mais on le gère ici aussi en sécurité
    tier_map = {'free': 0, 'plus': 1, 'premium': 2}
    tier_score = tier_map.get(subscription_tier, 0)

    df = pd.DataFrame([{
        'note': note,
        'type_analyse': type_analyse,
        'nb_allergies': nb_allergies
    }])

    pred = model.predict(df)[0]

    # ── Logique de priorisation par abonnement ──
    # Si le modèle dit "En attente" mais que le patient est Plus → on le passe en accepté
    # Premium est déjà court-circuité côté backend, mais par sécurité on le gère ici aussi
    if pred == 0 and subscription_tier == 'plus':
        pred = 1  # Plus → bonus priorité, auto-accepté
        print(f"[ML] Patient PLUS: override En attente → Acceptée automatiquement")
    elif subscription_tier == 'premium':
        pred = 1  # Premium → toujours accepté
        print(f"[ML] Patient PREMIUM: forcé → Acceptée automatiquement")

    result = "Acceptée automatiquement" if pred == 1 else "En attente"

    return jsonify({
        "result": result,
        "subscription_tier": subscription_tier,
        "tier_score": tier_score
    })

if __name__ == '__main__':
    app.run(port=5000)
