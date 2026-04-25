import { Injectable } from '@nestjs/common';
import axios from 'axios';
const FormData = require('form-data');

/**
 * OcrMlService — OCR Analysis with automatic fallback:
 *   1. Try Flask OCR microservice (port 5001)
 *   2. If Flask is down → Tesseract.js (WASM, zero external deps) + Regex analysis
 *      No Gemini API key needed.
 */

// ── Reference ranges (same as python/ocr_model.py) ──
const NORMAL_RANGES: Record<string, [number, number]> = {
	glycemie: [0.6, 1.1],
	uree: [0.1, 0.5],
	creatinine: [7, 14],
	'cholesterol total': [1.0, 2.0],
	triglycerides: [0.4, 1.5],
	hdl: [0.4, 0.9],
	ldl: [0.5, 1.6],
	hemoglobine: [12, 17],
	leucocytes: [4, 10],
	plaquettes: [150, 400],
	hematocrite: [37, 54],
	neutrophiles: [40, 80],
	lymphocytes: [20, 40],
	monocytes: [2, 10],
	eosinophiles: [1, 4],
	basophiles: [0, 1],
	crp: [0, 6],
	asat: [0, 40],
	alat: [0, 40],
	'gamma gt': [0, 60],
};

const ALIASES: Record<string, string[]> = {
	glycemie: ['glycemie', 'glycémie', 'glycemie a jeun'],
	uree: ['uree', 'urée'],
	creatinine: ['creatinine', 'créatinine'],
	'cholesterol total': ['cholesterol', 'cholesterol total'],
	triglycerides: ['triglycerides', 'triglycérides'],
	hdl: ['hdl', 'cholesterol hdl'],
	ldl: ['ldl', 'cholesterol ldl'],
	hemoglobine: ['hemoglobine', 'hémoglobine'],
	leucocytes: ['leucocytes'],
	plaquettes: ['plaquettes'],
	hematocrite: ['hematocrite', 'hématocrite'],
	neutrophiles: ['neutrophiles'],
	lymphocytes: ['lymphocytes'],
	monocytes: ['monocytes'],
	eosinophiles: ['eosinophiles'],
	basophiles: ['basophiles'],
	crp: ['crp'],
	asat: ['asat'],
	alat: ['alat'],
	'gamma gt': ['gamma', 'gamma gt'],
};

function matchNom(name: string): string | null {
	const lower = name.toLowerCase();
	for (const key of Object.keys(ALIASES)) {
		for (const alias of ALIASES[key]) {
			if (lower.includes(alias)) return key;
		}
	}
	return null;
}

function analyzeTextWithRegex(rawText: string): {
	description: string;
	analyses_detectees: { nom: string; valeur: number; statut: string }[];
} {
	const text = rawText.toLowerCase().replace(/,/g, '.');
	const pattern = /([a-zA-Zéèêàçôûîïü\s]+)\s+(\d+\.?\d*)/;
	const results: { nom: string; valeur: number; statut: string }[] = [];

	for (const line of text.split('\n')) {
		const match = line.match(pattern);
		if (!match) continue;
		const name = match[1].trim();
		const value = parseFloat(match[2]);
		const analyse = matchNom(name);
		if (!analyse) continue;
		const [minVal, maxVal] = NORMAL_RANGES[analyse];
		let statut = 'normal';
		if (value < minVal) statut = 'bas';
		else if (value > maxVal) statut = 'élevé';
		results.push({ nom: analyse, valeur: value, statut });
	}

	// Generate description (same logic as Python)
	if (results.length === 0) {
		return {
			description: 'Analyse automatique terminée. Aucun résultat anormal détecté.',
			analyses_detectees: results,
		};
	}

	const anomalies = results
		.filter((r) => r.statut !== 'normal')
		.map((r) => (r.statut === 'élevé' ? `${r.nom} élevée` : `${r.nom} basse`));

	const description =
		anomalies.length > 0
			? `Analyse automatique terminée. Les résultats montrent : ${anomalies.join(', ')}. Il est recommandé de consulter un professionnel de santé pour une interprétation médicale complète.`
			: 'Analyse automatique terminée. Tous les résultats sont dans les normes.';

	return { description, analyses_detectees: results };
}

@Injectable()
export class OcrMlService {
	/**
	 * 1) Try Flask OCR on port 5001
	 * 2) Fallback: Tesseract.js (WASM) + Regex — no external service needed
	 */
	async analyzeBuffer(fileBuffer: Buffer, filename: string, userId?: string): Promise<any> {
		let flaskError = '';

		// ── Attempt 1: Flask OCR ──
		const form = new FormData();
		form.append('file', fileBuffer, { filename });
		const baseUrl = process.env.OCR_FLASK_URL || 'http://127.0.0.1:5001';
		const url = `${baseUrl.replace(/\/+$/, '')}/analyser`;

		try {
			const response = await axios.post(url, form, {
				headers: {
					...form.getHeaders(),
					'ngrok-skip-browser-warning': 'true',
					...(userId ? { 'x-user-id': userId } : {}),
				},
				maxBodyLength: Infinity,
				timeout: 15000,
				validateStatus: () => true,
			});

			if (response.status >= 200 && response.status < 300) {
				console.log('[OcrMlService] ✅ Flask OCR success');
				return response.data;
			}
			
			// Fallback interne: si /analyser n'existe pas, tenter /analyze
			if (response.status === 404) {
				console.log('[OcrMlService] 🔄 /analyser not found, trying /analyze...');
				const altUrl = url.replace('/analyser', '/analyze');
				const altResponse = await axios.post(altUrl, form, {
					headers: {
						...form.getHeaders(),
						'ngrok-skip-browser-warning': 'true',
						...(userId ? { 'x-user-id': userId } : {}),
					},
					maxBodyLength: Infinity,
					timeout: 15000,
					validateStatus: () => true,
				});
				if (altResponse.status >= 200 && altResponse.status < 300) {
					console.log('[OcrMlService] ✅ Flask OCR success on /analyze');
					return altResponse.data;
				}
			}
			
			throw new Error(`Flask OCR error ${response.status}`);
		} catch (flaskErr: any) {
			flaskError = flaskErr.message || 'unknown';
			console.warn('[OcrMlService] ⚠️ Flask OCR unavailable:', flaskError);
		}

		// ── Attempt 2: Tesseract.js (WASM) + Regex analysis ──
		console.log('[OcrMlService] 🔄 Falling back to Tesseract.js + Regex…');
		try {
			const Tesseract = require('tesseract.js');
			const {
				data: { text: extractedText },
			} = await Tesseract.recognize(fileBuffer, 'fra+eng');

			console.log(`[OcrMlService] ✅ Tesseract extracted ${extractedText.length} chars`);

			const result = analyzeTextWithRegex(extractedText);
			return result;
		} catch (tessErr: any) {
			console.error('[OcrMlService] ❌ Tesseract.js failed:', tessErr.message);
			throw new Error(`OCR indisponible: Flask (${flaskError}) — Tesseract (${tessErr.message})`);
		}
	}
}
