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

    note = str(note).lower().strip()
    allergies = str(allergies).strip()
    
    nb_allergies = 0 if allergies == '' else len(allergies.split('|'))

    df = pd.DataFrame([{
        'note': note,
        'type_analyse': type_analyse,
        'nb_allergies': nb_allergies
    }])

    pred = model.predict(df)[0]

    result = "Acceptée automatiquement" if pred == 1 else "En attente"

    return jsonify({"result": result})

if __name__ == '__main__':
    app.run(port=5000)
