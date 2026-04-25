import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import axios from 'axios';

export interface AiAnalysisResult {
  diagnosis: string;
  advice: string;
  prescription_suggestions: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  emergency_level: 'faible' | 'moyen' | 'critique';
  confidence: number;
  sources: string[];
  /** true si l’image n’est pas un document médical exploitable (OCR / filtre) */
  documentRejected?: boolean;
}

export interface ModelStatus {
  available: boolean;
  provider: 'gemini' | 'llama-server' | 'none';
  modelName: string;
  message: string;
}

@Injectable()
export class DoctorAiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DoctorAiService.name);
  private readonly inferenceTimeoutMs = 180000;
  private readonly maxPromptChars = 2000; // Réduit pour accélérer l'analyse locale
  private isEngineFound = false;

  private get serverUrl(): string {
    let url = process.env.KAGGLE_AI_URL || 'http://127.0.0.1:5000/analyze';
    if (!url.endsWith('/analyze')) {
      url = url.replace(/\/$/, '') + '/analyze';
    }
    return url;
  }

  // Cache global pour Tesseract pour éviter de recharger le modèle OCR à chaque fois
  private tesseractWorker: any = null;

  // Modèle cible : medaichain-medical-3B-Q4_K_M.gguf (fine-tuné par l'équipe)
  private readonly MODEL_NAME = 'medaichain-medical-3B-Q4_K_M';

  constructor() { }

  async onModuleInit() {
    this.logger.log(
      `Initialisation du service IA. Vérifiez que start_ai_server.bat est lancé.`,
    );
    this.isEngineFound = true;
  }

  async onModuleDestroy() {
    this.logger.log('Service IA arrêté.');
  }

  async checkModelStatus(): Promise<ModelStatus> {
    const baseUrl = (process.env.KAGGLE_AI_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    
    // Try multiple health check endpoints (different notebooks expose different routes)
    const endpoints = ['/health', '/', '/predict'];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const response = await axios.get(url, {
          timeout: 3000,
          headers,
          validateStatus: (status) => status < 500,
        });
        
        if (response.status < 400) {
          this.logger.log(`[HealthCheck] ✅ Serveur IA joignable via ${endpoint} (status: ${response.status})`);
          return {
            available: true,
            provider: 'llama-server',
            modelName: 'Kaggle - Python - API',
            message: `Serveur IA distant (Kaggle) opérationnel via ${endpoint}`,
          };
        }
      } catch (e) {
        // Try next endpoint
      }
    }
    
    // All endpoints failed — try a simple TCP-level check as last resort
    try {
      await axios.get(baseUrl, {
        timeout: 3000,
        headers,
        validateStatus: () => true, // accept any HTTP status
      });
      // If we get ANY response (even 404), the server is alive
      this.logger.log(`[HealthCheck] ✅ Serveur IA joignable (réponse HTTP reçue)`);
      return {
        available: true,
        provider: 'llama-server',
        modelName: 'Kaggle - Python - API',
        message: 'Serveur IA distant (Kaggle) opérationnel (réponse HTTP reçue)',
      };
    } catch (e) {
      return {
        available: false,
        provider: 'none',
        modelName: '',
        message: `Serveur IA Kaggle injoignable sur ${baseUrl}. Pensez à démarrer le notebook.`,
      };
    }
  }

  /**
   * Llama-server est textuel : on extrait le texte avec Tesseract (OCR local, sans Gemini),
   * puis on filtre (confiance OCR + forme « document médical ») avant d’appeler le LLM.
   */
  async analyzeReport(
  imageBase64: string,
  context ?: string,
): Promise < AiAnalysisResult > {
  const raw = (imageBase64 || '').trim();
  if(!raw) {
    return this.buildRefusalResult('Aucune image fournie.');
  }

    const { base64Data } = this.parseDataImageUrl(raw);

  this.logger.log('OCR Tesseract sur image médecin (sans service cloud)...');
  const { text: extracted, confidence: ocrConfidence } =
    await this.extractWithTesseract(base64Data);

  if(!extracted || extracted.length < 12) {
  return this.buildRefusalResult(
    'OCR : texte absent ou trop court. Photo floue, trop sombre, ou sans texte lisible.',
  );
}

  if (ocrConfidence != null && ocrConfidence < 42 && extracted.length < 120) {
    return this.buildRefusalResult(
      `OCR peu fiable (confiance ${Math.round(ocrConfidence)} %). Refaites une photo plus nette, droite et bien éclairée du document.`,
    );
  }

if (!this.looksLikeMedicalSnippet(extracted)) {
  return this.buildRefusalResult(
    'Le texte OCR ne ressemble pas à un document médical (bilan, ordonnance, courrier de labo, etc.). Les photos d’objets ou de publicités donnent souvent du bruit sans données cliniques exploitables.',
  );
}

  const ctx = context
    ? `${context}\n[Texte issu de l’OCR Tesseract sur l’image — n’utiliser que ces caractères, sans inventer de valeurs absentes.]`
    : '[Texte issu de l’OCR Tesseract sur l’image — n’utiliser que ces caractères, sans inventer de valeurs absentes.]';

// We send to the remote Python server
return this.analyzeText(extracted, ctx);
  }

  async analyzeText(text: string, context ?: string): Promise < AiAnalysisResult > {
  const normalizedText = (text || '').replace(/\s+/g, ' ').trim();
  const truncatedText =
    normalizedText.length > this.maxPromptChars
      ? `${normalizedText.slice(0, this.maxPromptChars)} [TRONQUE]`
      : normalizedText;

  if (normalizedText.length > this.maxPromptChars) {
    this.logger.warn(
      `Texte OCR tronqué (${normalizedText.length} -> ${truncatedText.length} chars)`,
    );
  }

// Call the deployed Python Analysis server
return this.runInference(truncatedText, context);
  }

  private async runInference(text: string, context ?: string): Promise < AiAnalysisResult > {
    const baseUrl = (process.env.KAGGLE_AI_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');
    const headers = { 
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    };
    
    // Try multiple route patterns (different notebooks define different endpoints)
    const attempts = [
      { url: `${baseUrl}/analyze`, body: { text, context: context || '' } },
      { url: `${baseUrl}/analyser`, body: { ocr_text: text } },
      { url: `${baseUrl}/predict`, body: { note: text, type_analyse: 'medical_report', allergies: '' } },
    ];
    
    for (const attempt of attempts) {
      try {
        this.logger.log(`[KAGGLE API] Tentative vers ${attempt.url} ...`);
        const response = await axios.post(attempt.url, attempt.body, {
          timeout: this.inferenceTimeoutMs,
          headers,
          validateStatus: (status) => status < 500,
        });
        
        if (response.status >= 200 && response.status < 400 && response.data) {
          this.logger.log(`[KAGGLE API] ✅ Réponse reçue via ${attempt.url} (status: ${response.status})`);
          
          // Handle different response formats
          if (response.data.success && response.data.data) {
            return this.parseAiResponse(JSON.stringify(response.data.data));
          }
          if (response.data.diagnosis || response.data.diagnostic) {
            return this.parseAiResponse(JSON.stringify(response.data));
          }
          if (response.data.analyses_detectees || response.data.description) {
            const desc = response.data.description || 'Analyse terminée.';
            const analyses = response.data.analyses_detectees || [];
            return {
              diagnosis: desc,
              advice: analyses.length > 0 
                ? `${analyses.length} résultats d'analyse détectés. Consultez votre médecin pour une interprétation complète.`
                : 'Aucune anomalie détectée dans les résultats.',
              prescription_suggestions: [],
              emergency_level: analyses.some((a: any) => a.statut === 'élevé' || a.status === 'élevé') ? 'moyen' : 'faible',
              confidence: 0.80,
              sources: ['Kaggle ML Service', 'OCR Analysis'],
              documentRejected: false,
            };
          }
          if (response.data.result) {
            return {
              diagnosis: response.data.result,
              advice: 'Analyse effectuée par le service ML distant.',
              prescription_suggestions: [],
              emergency_level: 'faible',
              confidence: 0.75,
              sources: ['Kaggle ML Predict'],
              documentRejected: false,
            };
          }
        }
      } catch (e: any) {
        this.logger.warn(`[KAGGLE API] ⚠️ Échec sur ${attempt.url}: ${e.message}`);
      }
    }
    
    // ── All Kaggle routes failed → Fallback to local Gemini AI ──
    this.logger.warn('[KAGGLE API] ❌ Toutes les routes Kaggle ont échoué. Fallback vers Gemini AI local...');
    return this.analyzeWithGeminiLocal(text, context);
  }
  
  /**
   * Fallback: analyze medical text locally using Gemini AI API
   */
  private async analyzeWithGeminiLocal(text: string, context?: string): Promise<AiAnalysisResult> {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error('No GEMINI_API_KEY configured');
      }
      
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `Tu es un assistant médical IA expert. Analyse ce texte médical extrait par OCR et fournis un diagnostic structuré.

Texte médical:
${text}
${context ? `\nContexte additionnel: ${context}` : ''}

Retourne un JSON avec cette structure EXACTE:
{
  "diagnosis": "Diagnostic détaillé basé sur les résultats",
  "advice": "Conseils médicaux pour le patient (rassurants et clairs)",
  "prescription_suggestions": [
    {"name": "Nom du médicament si applicable", "dosage": "Dosage", "frequency": "Fréquence", "duration": "Durée"}
  ],
  "emergency_level": "faible" ou "moyen" ou "critique",
  "confidence": 0.85
}

IMPORTANT: Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

      const result = await aiModel.generateContent(prompt);
      const response = result.response.text();
      
      let jsonText = response.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      this.logger.log('[Gemini Fallback] ✅ Analyse locale Gemini réussie');
      const parsed = this.parseAiResponse(jsonText);
      parsed.sources = ['Gemini AI (Fallback local)', 'OCR Tesseract'];
      return parsed;
    } catch (geminiErr: any) {
      this.logger.error(`[Gemini Fallback] ❌ Erreur: ${geminiErr.message}`);
      throw new HttpException(
        `Service IA indisponible (Kaggle + Gemini). Détail: ${geminiErr.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private parseDataImageUrl(input: string): {
  mimeType: string;
  base64Data: string;
} {
  const m = input.match(/^data:([^;]+);base64,(.+)$/is);
  if (m) {
    return { mimeType: m[1].trim(), base64Data: m[2].replace(/\s/g, '') };
  }
  return { mimeType: 'image/jpeg', base64Data: input.replace(/\s/g, '') };
}

  private async extractWithTesseract(
  base64Data: string,
): Promise < { text: string; confidence: number | null } > {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Tesseract = require('tesseract.js');
  const buf = Buffer.from(base64Data, 'base64');

  // Utilisation du cache pour éviter ~4 secs d'initialisation du parseur à chaque image
  if(!this.tesseractWorker) {
  this.logger.log('Initialisation du cache OCR Tesseract...');
  this.tesseractWorker = await Tesseract.createWorker('fra+eng', 1, {
    logger: () => undefined,
  });
}

const {
  data: { text, confidence },
} = await this.tesseractWorker.recognize(buf);

const cleaned = (text || '').replace(/\s+/g, ' ').trim();
const conf =
  typeof confidence === 'number' && !Number.isNaN(confidence)
    ? confidence
    : null;
return { text: cleaned, confidence: conf };
  }

  /** Filtre grossier après OCR pour limiter les analyses sur du « bruit » (objets, pubs). */
  private looksLikeMedicalSnippet(text: string): boolean {
  const t = text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const keywords =
    /creat|uree|gluc|hemo|hemogl|hemat|bilan|labo|labor|patient|mg\/l|g\/l|mmol|umol|iu\/l|u\/l|prescri|ordonn|medec|compte.rendu|examen|result|refer|norm|valeur|analyse|sang|serum|plasma|leucoc|plaquet|cholest|transamin|bilirub|crp|inr|hba1c|glycem/i.test(
      t,
    );
  const labUnits =
    /\d+[,.]?\d*\s*(?:g\/l|mg\/l|mmol\/l|µmol\/l|umol\/l|ui\/l|iu\/l|%)\b/i.test(
      text,
    );
  const rangeLike =
    /\b\d+[,.]?\d*\s*[-–]\s*\d+[,.]?\d*\b/.test(text) && /\d/.test(t);
  return keywords || labUnits || (rangeLike && t.length > 45);
}

  private buildRefusalResult(reason: string): AiAnalysisResult {
  return {
    diagnosis: reason,
    advice:
      'Importez une photo nette et bien cadrée d’un bilan de laboratoire, d’une ordonnance lisible ou d’un compte-rendu médical. Évitez les photos de produits ou scènes sans document textuel.',
    prescription_suggestions: [],
    emergency_level: 'faible',
    confidence: 0.08,
    sources: [
      'Filtrage document — MedAIChain (pas d’analyse clinique sur cette image)',
    ],
    documentRejected: true,
  };
}

  private parseAiResponse(rawResponse: string): AiAnalysisResult {
  try {
    let cleaned = rawResponse.trim();

    // Filtrer les logs parasites (DLL injection Windows, overlay GPU, etc.)
    const lines = cleaned.split(/\r?\n/);
    const filteredLines = lines.filter(
      (line) =>
        !line.includes('HookApp') &&
        !line.includes('graphicsWindow') &&
        !line.includes('injectWindow'),
    );
    cleaned = filteredLines.join('\n').trim();

    // Extraire le premier objet JSON valide
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    this.logger.debug(
      `[${this.MODEL_NAME}] Réponse JSON (extrait) : ${cleaned.substring(0, 200)}`,
    );

    const parsed = JSON.parse(cleaned);

    // ── Mapper la réponse sur les 4 champs du Modelfile ──────────────────
    // Le modèle entraîné retourne : diagnosis, advice,
    // prescription_suggestions, emergency_level
    // confidence et sources ne sont pas dans le dataset d'entraînement
    // → on leur affecte des valeurs par défaut cohérentes
    return {
      diagnosis:
        parsed.diagnosis ||
        parsed.diagnostic || // tolérance orthographique
        'Diagnostic non disponible.',
      advice:
        parsed.advice ||
        parsed.conseils || // tolérance orthographique
        'Aucun conseil spécifique.',
      prescription_suggestions: Array.isArray(parsed.prescription_suggestions)
        ? parsed.prescription_suggestions.map((p: any) => ({
          name: p.name || p.nom || 'Non spécifié',
          dosage: p.dosage || p.dose || 'Non spécifié',
          frequency: p.frequency || p.frequence || 'Non spécifié',
          duration: p.duration || p.duree || 'Non spécifié',
        }))
        : [],
      emergency_level: ['faible', 'moyen', 'critique'].includes(
        parsed.emergency_level,
      )
        ? parsed.emergency_level
        : 'faible',
      // Champs non présents dans le dataset → valeurs par défaut
      confidence:
        typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      sources:
        Array.isArray(parsed.sources) && parsed.sources.length > 0
          ? parsed.sources
          : [`${this.MODEL_NAME}`, 'OCR Tesseract'],
      documentRejected: false,
    };
  } catch (error) {
    this.logger.error(
      `[${this.MODEL_NAME}] Erreur parsing JSON : ${error.message}`,
    );
    this.logger.debug(`Réponse brute : ${rawResponse.substring(0, 400)}`);
    return {
      diagnosis: `Le modèle a retourné une réponse non-JSON. Réponse brute : ${rawResponse.substring(0, 200)}`,
      advice: 'Veuillez réessayer ou consulter un médecin.',
      prescription_suggestions: [],
        emergency_level: 'faible',
          confidence: 0.3,
            sources: [`${this.MODEL_NAME} — erreur de format`],
              documentRejected: false,
      };
}
  }
}