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
    try {
      // Check the new python API endpoint
      const response = await axios.get(this.serverUrl.replace('/analyze', '/'), {
        timeout: 1000,
      });
      return {
        available: true,
        provider: 'llama-server',
        modelName: 'Kaggle - Python - API',
        message: `Serveur IA distant (Kaggle) opérationnel: ${response.data?.status}`,
      };
    } catch (e) {
      return {
        available: false,
        provider: 'none',
        modelName: '',
        message: `Serveur IA Kaggle injoignable sur ${this.serverUrl}. Pensez à démarrer le notebook.`,
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
  try {
    this.logger.log(`[KAGGLE API] Envoi de l'image/texte vers ${this.serverUrl} ...`);

      const response = await axios.post(
      this.serverUrl,
      {
        text: text,
        context: context || ''
      },
      {
        timeout: this.inferenceTimeoutMs,
        headers: { 'Content-Type': 'application/json' },
      },
    );

    this.logger.log(`[KAGGLE API] Analyse réussie avec le statut: ${response.status}`);

    if(!response.data || !response.data.success) {
  throw new Error(response.data?.error || "Error from Python backend");
}

// Reuse the existing parseAiResponse to format it perfectly for the frontend
return this.parseAiResponse(JSON.stringify(response.data.data));
    } catch (e: any) {
  if (e.response) {
    this.logger.error(`[KAGGLE API ERREUR REPONSE] : Status = ${e.response.status}, Data = ${JSON.stringify(e.response.data)}`);
  } else if (e.request) {
    this.logger.error(`[KAGGLE API HORS LIGNE] : Aucune réponse du serveur Kaggle / Ngrok à l'URL ${this.serverUrl}. Vérifiez si le notebook Kaggle tourne toujours.`);
      } else {
    this.logger.error(`[KAGGLE API ERREUR EXÉCUTION] : ${e.message}`);
  }

  throw new HttpException(
    `Erreur lors de l'analyse distante (Serveur IA Kaggle injoignable ou erreur interne). Détail: ${e.message}`,
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