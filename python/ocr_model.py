"""
Service Flask OCR — doit correspondre à OcrMlService (Nest) : POST /analyser
et au front Flutter : analyses_detectees + description.
"""
import os
import re
import shutil
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import pytesseract
from flask import Flask, jsonify, request
from pdf2image import convert_from_bytes
from PIL import Image


def _resolve_tesseract_cmd() -> Optional[str]:
    """Trouve l'exécutable Tesseract (PATH, TESSERACT_CMD, chemins Windows courants)."""
    env = os.environ.get("TESSERACT_CMD", "").strip()
    if env and Path(env).is_file():
        return env

    which = shutil.which("tesseract")
    if which:
        return which

    if os.name == "nt":
        for candidate in (
            Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
            Path(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
            Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Tesseract-OCR" / "tesseract.exe",
        ):
            if candidate.is_file():
                return str(candidate)
    return None


_tess_path = _resolve_tesseract_cmd()
if _tess_path:
    pytesseract.pytesseract.tesseract_cmd = _tess_path

app = Flask(__name__)

normal_ranges = {
    "glycemie": (0.6, 1.1),
    "uree": (0.1, 0.5),
    "creatinine": (7, 14),
    "cholesterol total": (1.0, 2.0),
    "triglycerides": (0.4, 1.5),
    "hdl": (0.4, 0.9),
    "ldl": (0.5, 1.6),
    "hemoglobine": (12, 17),
    "leucocytes": (4, 10),
    "plaquettes": (150, 400),
    "hematocrite": (37, 54),
    "neutrophiles": (40, 80),
    "lymphocytes": (20, 40),
    "monocytes": (2, 10),
    "eosinophiles": (1, 4),
    "basophiles": (0, 1),
    "crp": (0, 6),
    "asat": (0, 40),
    "alat": (0, 40),
    "gamma gt": (0, 60),
}

aliases = {
    "glycemie": ["glycemie", "glycémie", "glycemie a jeun"],
    "uree": ["uree", "urée"],
    "creatinine": ["creatinine", "créatinine"],
    "cholesterol total": ["cholesterol", "cholesterol total"],
    "triglycerides": ["triglycerides", "triglycérides"],
    "hdl": ["hdl", "cholesterol hdl"],
    "ldl": ["ldl", "cholesterol ldl"],
    "hemoglobine": ["hemoglobine", "hémoglobine"],
    "leucocytes": ["leucocytes"],
    "plaquettes": ["plaquettes"],
    "hematocrite": ["hematocrite", "hématocrite"],
    "neutrophiles": ["neutrophiles"],
    "lymphocytes": ["lymphocytes"],
    "monocytes": ["monocytes"],
    "eosinophiles": ["eosinophiles"],
    "basophiles": ["basophiles"],
    "crp": ["crp"],
    "asat": ["asat"],
    "alat": ["alat"],
    "gamma gt": ["gamma", "gamma gt"],
}


def match_nom(name: str):
    name = name.lower()
    for key in aliases:
        for alias in aliases[key]:
            if alias in name:
                return key
    return None


def generer_description(analyse_output):
    if not analyse_output:
        return (
            "Analyse automatique terminée. Aucun résultat anormal détecté."
        )
    anomalies = []
    for item in analyse_output:
        if item["statut"] == "élevé":
            anomalies.append(f"{item['nom']} élevée")
        elif item["statut"] == "bas":
            anomalies.append(f"{item['nom']} basse")
    message = "Analyse automatique terminée. Les résultats montrent : "
    message += ", ".join(anomalies) + ". "
    message += (
        "Il est recommandé de consulter un professionnel de santé pour une "
        "interprétation médicale complète."
    )
    return message


def _image_to_gray(pil_image: Image.Image) -> np.ndarray:
    img = np.array(pil_image.convert("RGB"))
    return cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)


def _run_ocr_on_gray(gray: np.ndarray) -> str:
    gray = cv2.resize(gray, None, fx=2, fy=2)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        2,
    )
    return pytesseract.image_to_string(thresh, lang="fra+eng", config="--oem 3 --psm 6")


def analyser_fichier(file_storage, filename: str):
    from io import BytesIO

    file_bytes = file_storage.read()
    filename_l = (filename or "").lower()

    if filename_l.endswith(".pdf"):
        pages = convert_from_bytes(file_bytes)
        if not pages:
            raise ValueError("PDF sans page lisible")
        image = pages[0]
    else:
        image = Image.open(BytesIO(file_bytes))

    gray = _image_to_gray(image)
    text = _run_ocr_on_gray(gray)
    text = text.lower().replace(",", ".")

    pattern = r"([a-zA-Zéèêàç\s]+)\s+(\d+\.?\d*)"
    results = []

    for line in text.split("\n"):
        match = re.search(pattern, line)
        if not match:
            continue
        name = match.group(1).strip()
        value = float(match.group(2))
        analyse = match_nom(name)
        if not analyse:
            continue
        min_val, max_val = normal_ranges[analyse]
        if value < min_val:
            statut = "bas"
        elif value > max_val:
            statut = "élevé"
        else:
            statut = "normal"
        if statut != "normal":
            results.append(
                {"nom": analyse, "valeur": value, "statut": statut}
            )

    description = generer_description(results)
    return {"analyses_detectees": results, "description": description}


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok" if _tess_path else "degraded",
            "service": "ocr",
            "tesseract_exe": _tess_path,
        }
    )


def _handle_analyse():
    if not _tess_path:
        return (
            jsonify(
                {
                    "error": (
                        "Tesseract OCR introuvable. Installez-le depuis "
                        "https://github.com/UB-Mannheim/tesseract/wiki "
                        "(cochez les langues fra + eng), ou définissez TESSERACT_CMD "
                        "vers le chemin de tesseract.exe, puis redémarrez ce service."
                    )
                }
            ),
            503,
        )
    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier envoyé"}), 400
    file = request.files["file"]
    if not file or not file.filename:
        return jsonify({"error": "Fichier vide"}), 400
    try:
        data = analyser_fichier(file, file.filename)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analyser", methods=["POST"])
def analyser():
    return _handle_analyse()


@app.route("/analyse", methods=["POST"])
def analyse_legacy():
    """Alias pour anciens clients."""
    return _handle_analyse()


if __name__ == "__main__":
    print(f"[OCR] Tesseract: {_tess_path or 'NON TROUVE — installez Tesseract ou definissez TESSERACT_CMD'}")
    app.run(host="0.0.0.0", port=5001)
