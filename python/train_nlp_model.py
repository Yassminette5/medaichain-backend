import pandas as pd
import numpy as np
import json
import joblib
import re
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "nlp_diagnosis_model.pkl"
META_PATH = BASE_DIR / "nlp_diagnosis_meta.json"

# Données synthétiques de symptômes et diagnostics correspondants
data = {
    "symptoms": [
        # Appendicite
        "J'ai très mal en bas du ventre à droite, j'ai envie de vomir et j'ai de la fièvre",
        "Douleur aiguë fosse iliaque droite, nausées, température 39",
        "Mal au ventre côté droit, vomissements depuis ce matin",
        "Douleur violente au niveau de l'appendice, ne peut pas marcher",
        
        # Cardio
        "J'ai une douleur très forte à la poitrine gauche et du mal à respirer",
        "Douleur thoracique oppressante, essoufflement, douleur bras gauche",
        "Sensation d'écrasement sur la poitrine, respiration difficile",
        "Palpitations cardiaques intenses avec sueurs froides et vertiges",
        
        # Grippe / Viral
        "J'ai mal à la tête, le nez qui coule et un peu de toux",
        "Fièvre légère, courbatures, toux sèche et rhume",
        "Je me sens fatigué, j'ai froid et le nez bouché",
        "Maux de gorge, frissons, courbatures dans tout le corps",
        
        # Urinaire
        "Je vais souvent aux toilettes, ça brûle quand j'urine",
        "Douleur au moment d'uriner, urines fréquentes",
        "Sensation de brûlure urinaire et petite fièvre",
        "Sang dans les urines, douleur au bas ventre",
        
        # Allergie
        "J'ai des plaques rouges qui grattent sur tout le corps",
        "Démangeaisons intenses, éruption cutanée soudaine",
        "Plaques et boutons rouges apparus après avoir mangé des fraises",
        "Gorge qui gonfle, difficulté à respirer après piqûre d'abeille",
        
        # Vertiges / Neuro
        "J'ai des vertiges quand je me lève vite, et des maux de tête",
        "Tête qui tourne, sifflements dans les oreilles",
        "Perte d'équilibre et nausées depuis 2 jours",
        "Sensation que la pièce tourne autour de moi, acouphènes",
        
        # Gastro-entérite
        "Diarrhée sévère depuis la nuit dernière avec vomissements",
        "Maux d'estomac, selles liquides et crampes abdominales",
        "Infection intestinale, je ne garde aucune nourriture",
        "Nausées, vomissements et diarrhée aiguë",
        
        # Asthme
        "Je n'arrive plus à respirer, ma poitrine siffle",
        "Crise d'asthme, grand manque d'air, respiration sifflante",
        "Essoufflement majeur, je suffoque même au repos",
        "Toux asthmatique forte, difficulté respiratoire",
        
        # Colique néphrétique
        "Douleur atroce dans le bas du dos qui descend vers le ventre",
        "Mal de dos insupportable, urines foncées, douleur lombaire",
        "Crise de colique néphrétique, je hurle de douleur au rein",
        "Douleur violente au niveau des reins, impossible de bouger",
        
        # Traumatisme / Fracture
        "Je suis tombé et ma cheville a gonflé immédiatement, très douloureuse",
        "Douleur intense au poignet après une chute, déformation visible",
        "Coupure profonde au doigt qui saigne beaucoup, blessure",
        "Entorse au genou après le foot, impossible de poser le pied",
        
        # ORL (Angine/Otite)
        "Mal de gorge terrible, difficulté à avaler, ganglions",
        "Douleur aiguë dans l'oreille droite, comme une aiguille",
        "Angine blanche, fièvre, amygdales gonflées",
        "Otite très douloureuse, oreille bouchée",
        
        # Mots génériques / Bruit (Atypiques)
        "Urgence", "Besoin d'un médecin consultation rapide", 
        "J'ai mal partout, je suis malade", "Rien de spécial, visite de contrôle"
    ],
    "diagnosis": [
        "Appendicite aiguë", "Appendicite aiguë", "Appendicite aiguë", "Appendicite aiguë",
        "Urgence Cardiovasculaire (Infarctus)", "Urgence Cardiovasculaire (Infarctus)", "Urgence Cardiovasculaire (Infarctus)", "Urgence Cardiovasculaire (Infarctus)",
        "Syndrome Grippal / Viral", "Syndrome Grippal / Viral", "Syndrome Grippal / Viral", "Syndrome Grippal / Viral",
        "Infection Urinaire", "Infection Urinaire", "Infection Urinaire", "Infection Urinaire",
        "Réaction Allergique", "Réaction Allergique", "Réaction Allergique", "Réaction Allergique",
        "Trouble Vestibulaire / Vertiges", "Trouble Vestibulaire / Vertiges", "Trouble Vestibulaire / Vertiges", "Trouble Vestibulaire / Vertiges",
        "Gastro-entérite aiguë", "Gastro-entérite aiguë", "Gastro-entérite aiguë", "Gastro-entérite aiguë",
        "Crise d'asthme sévère", "Crise d'asthme sévère", "Crise d'asthme sévère", "Crise d'asthme sévère",
        "Colique néphrétique", "Colique néphrétique", "Colique néphrétique", "Colique néphrétique", # Added one more to make 4
        "Traumatisme / Blessure", "Traumatisme / Blessure", "Traumatisme / Blessure", "Traumatisme / Blessure",
        "Infection ORL", "Infection ORL", "Infection ORL", "Infection ORL",
        "Symptômes non spécifiques", "Symptômes non spécifiques", "Symptômes non spécifiques", "Symptômes non spécifiques"
    ]
}

# Fonction de nettoyage basique
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text

def main():
    print("=" * 60)
    print("🏥 MedAIChain — Entraînement du modèle NLP Pré-Diagnostic")
    print("=" * 60)
    
    df = pd.DataFrame(data)
    df['clean_symptoms'] = df['symptoms'].apply(clean_text)
    
    X = df['clean_symptoms']
    y = df['diagnosis']
    
    # Création du pipeline NLP
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
        ('clf', MultinomialNB())
    ])
    
    # Pour un si petit dataset synthétique, on entraîne sur tout pour la démo
    pipeline.fit(X, y)
    
    # Évaluation rapide (sur le train set car dataset factice)
    preds = pipeline.predict(X)
    acc = accuracy_score(y, preds)
    print(f"Accuracy (Train) : {acc:.3f}")
    
    # Sauvegarde
    joblib.dump(pipeline, MODEL_PATH)
    
    # Classes supportées
    classes = list(pipeline.classes_)
    
    with open(META_PATH, 'w') as f:
        json.dump({'model_type': 'TF-IDF + NaiveBayes', 'classes': classes}, f)
        
    print("✅ Modèle NLP sauvegardé !")
    
    # Test
    test_text = "J'ai le nez bouché et je tousse"
    print(f"Test rapide : '{test_text}' -> {pipeline.predict([clean_text(test_text)])[0]}")

if __name__ == "__main__":
    main()
