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
  private readonly serverUrl = 'http://127.0.0.1:8081/v1/chat/completions';

  // Cache global pour Tesseract pour éviter de recharger le modèle OCR à chaque fois (gain de 3-4 secondes)
  private tesseractWorker: any = null;

  // ── Prompt système — aligné exactement sur le Modelfile d'entraînement ──────
  // Source : ai-training/Modelfile (FROM Llama-3.2-3B-Instruct.Q4_K_M.gguf)
  private readonly MEDICAL_PROMPT = `Tu es MedAIChain, un assistant médical IA spécialisé dans l'analyse de rapports médicaux (analyses de sang, bilans biologiques, radiographies).

Tu dois toujours répondre en JSON structuré avec exactement ces champs :
- "diagnosis" : Un résumé clair du diagnostic basé sur l'analyse.
- "advice" : Des conseils hygiéno-diététiques personnalisés pour le patient.
- "prescription_suggestions" : Une liste d'objets { "name", "dosage", "frequency", "duration" } pour les médicaments recommandés. Liste vide si aucun médicament n'est nécessaire.
- "emergency_level" : "faible", "moyen" ou "critique" selon la gravité.

Réponds UNIQUEMENT en JSON valide, sans texte supplémentaire.`;

  // Modèle cible : medaichain-medical-3B-Q4_K_M.gguf (fine-tuné par l'équipe)
  private readonly MODEL_NAME = 'medaichain-medical-3B-Q4_K_M';

  constructor() {}

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
      // 500ms timeout for faster status check
      const response = await axios.get('http://127.0.0.1:8081/v1/models', {
        timeout: 500,
      });
      const models = response.data?.data;
      const modelId = models?.[0]?.id || 'medaichain-medical-3B';
      return {
        available: true,
        provider: 'llama-server',
        modelName: modelId,
        message: `Serveur IA local opérationnel (${modelId}).`,
      };
    } catch (e) {
      return {
        available: false,
        provider: 'none',
        modelName: '',
        message: `Serveur IA local injoignable sur le port 8081. Lancez start_ai_server.bat`,
      };
    }
  }

  /**
   * Llama-server est textuel : on extrait le texte avec Tesseract (OCR local, sans Gemini),
   * puis on filtre (confiance OCR + forme « document médical ») avant d’appeler le LLM.
   */
  async analyzeReport(
    imageBase64: string,
    context?: string,
  ): Promise<AiAnalysisResult> {
    const raw = (imageBase64 || '').trim();
    if (!raw) {
      return this.buildRefusalResult('Aucune image fournie.');
    }

    const { base64Data } = this.parseDataImageUrl(raw);

    this.logger.log('OCR Tesseract sur image médecin (sans service cloud)...');
    const { text: extracted, confidence: ocrConfidence } =
      await this.extractWithTesseract(base64Data);

    if (!extracted || extracted.length < 12) {
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

    return this.analyzeText(extracted, ctx);
  }

  async analyzeText(text: string, context?: string): Promise<AiAnalysisResult> {
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

    // ── Format aligné sur les données d'entraînement (medical_dataset.jsonl) ──
    // Modèle entraîné avec : "Analyse cette analyse médicale et donne le
    // diagnostic, les conseils et l'ordonnance. Réponds en JSON structuré."
    const baseInstruction =
      "Analyse cette analyse médicale et donne le diagnostic, les conseils et l'ordonnance. Réponds en JSON structuré.";

    const userMessage = context
      ? `${baseInstruction}\n\nContexte patient : ${context}\n\nRésultats d'analyse :\n${truncatedText}`
      : `${baseInstruction}\n\n${truncatedText}`;

    return this.runInference(userMessage);
  }

  private async runInference(promptText: string): Promise<AiAnalysisResult> {
    if (!this.isEngineFound) {
      throw new HttpException(
        "Le moteur IA local n'est pas prêt.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      this.logger.log(`Inférence via modèle ${this.MODEL_NAME}...`);

      const response = await axios.post(
        this.serverUrl,
        {
          messages: [
            { role: 'system', content: this.MEDICAL_PROMPT },
            { role: 'user', content: promptText },
          ],
          // Paramètres alignés sur le Modelfile :
          // temperature 0.3 | top_p 0.9 | top_k 40 | num_predict 2048
          temperature: 0.3,
          top_p: 0.9,
          top_k: 40,
          max_tokens: 600,
          stop: ['<|eot_id|>'],
          response_format: { type: 'json_object' },
        },
        {
          timeout: this.inferenceTimeoutMs,
          headers: { 'Content-Type': 'application/json' },
        },
      );

      this.logger.log(`Analyse réussie via ${this.MODEL_NAME} !`);
      const content = response.data.choices[0].message.content;
      return this.parseAiResponse(content);
    } catch (e) {
      this.logger.error(`Erreur d'inférence ${this.MODEL_NAME} : ${e.message}`);
      throw new HttpException(
        `Erreur lors de l'analyse (modèle: ${this.MODEL_NAME}). Vérifiez que start_ai_server.bat est lancé.`,
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
  ): Promise<{ text: string; confidence: number | null }> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Tesseract = require('tesseract.js');
    const buf = Buffer.from(base64Data, 'base64');

    // Utilisation du cache pour éviter ~4 secs d'initialisation du parseur à chaque image
    if (!this.tesseractWorker) {
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
