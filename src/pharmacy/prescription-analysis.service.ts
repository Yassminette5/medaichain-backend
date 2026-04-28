import { Injectable } from '@nestjs/common';

export interface AnalyzedMedication {
  name: string;
  dosage?: string;
}

@Injectable()
export class PrescriptionAnalysisService {
  private static readonly KAGGLE_API_BASE_URL =
    process.env.PHARMACY_KAGGLE_URL || 'https://5201-34-6-75-171.ngrok-free.app';

  private static readonly LOGGED_ERROR_FLAG = Symbol.for(
    'medaichain.prescriptionAnalysis.logged',
  );

  private get baseUrl(): string {
    return PrescriptionAnalysisService.KAGGLE_API_BASE_URL.trim().replace(
      /\/$/,
      '',
    );
  }

  async extractMedicationsFromImageUrl(
    imageUrl: string,
  ): Promise<AnalyzedMedication[]> {
    if (!this.baseUrl || !imageUrl?.trim()) {
      return [];
    }

    const requestId = `prescription-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2, 10)}`;
    const startedAt = Date.now();
    let alreadyLoggedDetailedError = false;

    let imageResponse: Response;
    try {
      imageResponse = await fetch(imageUrl);
    } catch (error) {
      console.error(
        '[PrescriptionAnalysisService] Image download failed',
        this.buildLogContext({
          requestId,
          imageUrl,
          baseUrl: this.baseUrl,
          elapsedMs: Date.now() - startedAt,
          error: this.formatErrorForLog(error),
        }),
      );
      alreadyLoggedDetailedError = true;
      this.markErrorLogged(error);
      throw error;
    }

    if (!imageResponse.ok) {
      const imageErrorBody = await this.safeReadResponseText(imageResponse);
      console.error(
        '[PrescriptionAnalysisService] Image download returned non-OK response',
        this.buildLogContext({
          requestId,
          imageUrl,
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          contentType: imageResponse.headers.get('content-type'),
          responseBodySnippet: this.truncateForLog(imageErrorBody),
        }),
      );
      alreadyLoggedDetailedError = true;

      const downloadError = new Error(
        `Unable to download prescription image (${imageResponse.status})`,
      );
      this.markErrorLogged(downloadError);
      throw downloadError;
    }

    const contentType =
      imageResponse.headers.get('content-type') || 'application/octet-stream';
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBytes = imageBuffer.byteLength;

    if (imageBytes === 0) {
      console.error(
        '[PrescriptionAnalysisService] Downloaded image is empty (0 bytes)',
        this.buildLogContext({
          requestId,
          imageUrl,
          contentType,
        }),
      );
    }

    const blob = new Blob([imageBuffer], { type: contentType });
    const fileName = this.extractFileName(imageUrl);

    try {
      let response: Response;
      const kaggleStartedAt = Date.now();
      try {
        const maxAttempts = this.getPositiveIntEnv(
          'PRESCRIPTION_API_MAX_ATTEMPTS',
          2,
        );

        let lastError: unknown;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const attemptForm = new FormData();
            attemptForm.append('file', blob, fileName);

            if (attempt > 1) {
              console.warn(
                '[PrescriptionAnalysisService] Retrying Kaggle OCR request',
                this.buildLogContext({
                  requestId,
                  attempt,
                  maxAttempts,
                  baseUrl: this.baseUrl,
                }),
              );
            }

            response = await fetch(`${this.baseUrl}/process`, {
              method: 'POST',
              body: attemptForm,
            });
            lastError = undefined;
            break;
          } catch (error) {
            lastError = error;
            const retryable = this.isRetryableNetworkError(error);
            if (!retryable || attempt >= maxAttempts) {
              throw error;
            }

            const backoffMs = 500 * attempt;
            await this.sleep(backoffMs);
          }
        }

        if (!response) {
          throw lastError ?? new Error('Kaggle OCR request failed');
        }
      } catch (error) {
        const aborted = this.isAbortError(error);
        console.error(
          `[PrescriptionAnalysisService] Kaggle OCR request ${aborted ? 'aborted' : 'failed'}`,
          this.buildLogContext({
            requestId,
            imageUrl,
            baseUrl: this.baseUrl,
            imageBytes,
            elapsedMs: Date.now() - kaggleStartedAt,
            aborted,
            error: this.formatErrorForLog(error),
          }),
        );
        alreadyLoggedDetailedError = true;
        this.markErrorLogged(error);
        throw error;
      }

      if (!response.ok) {
        const errorBody = await this.safeReadResponseText(response);
        console.error(
          '[PrescriptionAnalysisService] Kaggle OCR returned non-OK response',
          this.buildLogContext({
            requestId,
            imageUrl,
            baseUrl: this.baseUrl,
            imageBytes,
            status: response.status,
            statusText: response.statusText,
            responseHeaders: Object.fromEntries(response.headers.entries()),
            responseBodySnippet: this.truncateForLog(errorBody),
          }),
        );
        alreadyLoggedDetailedError = true;

        const kaggleError = new Error(
          `Kaggle OCR request failed (${response.status})`,
        );
        this.markErrorLogged(kaggleError);
        throw kaggleError;
      }

      let payload: any;
      const responseClone = response.clone();
      try {
        payload = await response.json();
      } catch (error) {
        const nonJsonBody = await this.safeReadResponseText(responseClone);
        console.error(
          '[PrescriptionAnalysisService] Kaggle OCR returned invalid JSON',
          this.buildLogContext({
            requestId,
            imageUrl,
            baseUrl: this.baseUrl,
            status: response.status,
            statusText: response.statusText,
            responseHeaders: Object.fromEntries(response.headers.entries()),
            responseBodySnippet: this.truncateForLog(nonJsonBody),
            error: this.formatErrorForLog(error),
          }),
        );
        alreadyLoggedDetailedError = true;
        const invalidJsonError = new Error(
          'Kaggle OCR returned an invalid JSON response',
        );
        this.markErrorLogged(invalidJsonError);
        throw invalidJsonError;
      }
      const medications =
        payload?.data?.medications ?? payload?.medications ?? [];

      if (!Array.isArray(medications)) {
        return [];
      }

      const analyzedMedications = medications
        .map((item: any) => ({
          name: String(item?.name ?? '').trim(),
          dosage: String(item?.dosage ?? '').trim(),
        }))
        .filter((item: AnalyzedMedication) => item.name.length > 0);

      console.log(
        '[PrescriptionAnalysisService] Analysis result (medications):',
        analyzedMedications,
      );

      return analyzedMedications;
    } catch (error) {
      // Final catch to ensure we log *something* when an error wasn't logged earlier.
      if (!alreadyLoggedDetailedError && !this.isErrorLogged(error)) {
        console.error(
          '[PrescriptionAnalysisService] Prescription image analysis failed',
          this.buildLogContext({
            requestId,
            imageUrl,
            baseUrl: this.baseUrl,
            elapsedMs: Date.now() - startedAt,
            aborted: this.isAbortError(error),
            error: this.formatErrorForLog(error),
          }),
        );
        this.markErrorLogged(error);
      }
      throw error;
    }
  }

  private isErrorLogged(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    return (
      (error as Record<PropertyKey, unknown>)[
        PrescriptionAnalysisService.LOGGED_ERROR_FLAG
      ] === true
    );
  }

  private markErrorLogged<T>(error: T): T {
    if (error && typeof error === 'object') {
      try {
        (error as Record<PropertyKey, unknown>)[
          PrescriptionAnalysisService.LOGGED_ERROR_FLAG
        ] = true;
      } catch {
        // Some error objects may be non-extensible; logging still works via local flag.
      }
    }

    return error;
  }

  private isAbortError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const name = (error as { name?: unknown }).name;
    return typeof name === 'string' && name === 'AbortError';
  }

  private formatErrorForLog(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return { error };
  }

  private truncateForLog(value: string | undefined, maxLength = 2000): string {
    if (!value) {
      return '';
    }

    const normalized = String(value);
    return normalized.length > maxLength
      ? `${normalized.slice(0, maxLength)}…(truncated)`
      : normalized;
  }

  private async safeReadResponseText(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return '';
    }
  }

  private buildLogContext(context: Record<string, unknown>): Record<string, unknown> {
    // Ensures our console logs stay as a single object for easier reading.
    return context;
  }

  private extractFileName(imageUrl: string): string {
    try {
      const parsed = new URL(imageUrl);
      const candidate = parsed.pathname.split('/').pop();
      if (candidate && candidate.trim()) {
        return candidate;
      }
    } catch {
      // Fallback handled below.
    }

    return `prescription-${Date.now()}.jpg`;
  }

  private getPositiveIntEnv(name: string, defaultValue: number): number {
    const raw = process.env[name];
    if (!raw) {
      return defaultValue;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return defaultValue;
    }

    const intValue = Math.floor(parsed);
    return intValue > 0 ? intValue : defaultValue;
  }

  private isRetryableNetworkError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const anyError = error as any;
    const name = typeof anyError.name === 'string' ? anyError.name : '';
    const message = typeof anyError.message === 'string' ? anyError.message : '';
    const cause = anyError.cause;
    const code = cause && typeof cause.code === 'string' ? cause.code : '';

    // Node fetch (undici) often throws TypeError('fetch failed') with cause codes.
    if (name === 'TypeError' && message.toLowerCase().includes('fetch failed')) {
      return true;
    }

    // Common transient network errors.
    if (
      code === 'UND_ERR_SOCKET' ||
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'EAI_AGAIN' ||
      code === 'ENOTFOUND'
    ) {
      return true;
    }

    if (typeof message === 'string' && message.toLowerCase().includes('other side closed')) {
      return true;
    }

    return false;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
