import joblib
import re
model = joblib.load("nlp_diagnosis_model.pkl")
text = "urgence"
text = re.sub(r'[^\w\s]', '', text.lower())
pred = model.predict([text])[0]
probas = model.predict_proba([text])[0]
print("Pred:", pred)
print("Max Proba:", max(probas)*100)
