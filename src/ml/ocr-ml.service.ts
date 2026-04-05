import { Injectable } from '@nestjs/common';
import axios from 'axios';
// Use commonjs import to avoid type dependency for form-data
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');

@Injectable()
export class OcrMlService {
	/**
	 * Proxifie l'appel vers le service Flask OCR:
	 * POST {OCR_FLASK_URL}/analyser (multipart: file)
	 * OCR_FLASK_URL peut être défini dans l'env; défaut: http://127.0.0.1:5001
	 */
	async analyzeBuffer(fileBuffer: Buffer, filename: string, userId?: string): Promise<any> {
		const form = new FormData();
		form.append('file', fileBuffer, { filename });

		const baseUrl = process.env.OCR_FLASK_URL || 'http://127.0.0.1:5001';
		const url = `${baseUrl.replace(/\/+$/, '')}/analyser`;

		try {
			const response = await axios.post(url, form, {
				headers: {
					...form.getHeaders(),
					...(userId ? { 'x-user-id': userId } : {}),
				},
				maxBodyLength: Infinity,
				validateStatus: () => true, // we'll handle status manually for better logs
			});

			if (response.status >= 200 && response.status < 300) {
				return response.data;
			}

			console.error(
				`[OcrMlService] Flask OCR responded ${response.status}:`,
				typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data),
			);
			throw new Error(`Flask OCR error ${response.status}`);
		} catch (err: any) {
			const msg = err?.message || 'Unknown error';
			console.error('[OcrMlService] Request to Flask OCR failed:', msg);
			throw err;
		}
	}
}

