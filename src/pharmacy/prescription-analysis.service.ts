import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

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


    const raw = ( PrescriptionAnalysisService.KAGGLE_API_BASE_URL)
      .trim();
    return raw.replace(/\/$/, '');
  }

  private async tryReadLocalPrescriptionUpload(
    anyUrl: string,
  ): Promise<
    | {
        arrayBuffer: ArrayBuffer;
        byteLength: number;
        contentType: string;
        fileName: string;
      }
    | null
  > {
    const raw = (anyUrl || '').trim();
    if (!raw) return null;

    let pathname = raw;
    try {
      if (/^https?:\/\//i.test(raw)) {
        pathname = new URL(raw).pathname;
      }
    } catch {
      // ignore
    }

    const matchUploads = pathname.match(/\/uploads\/prescriptions\/([^/?#]+)$/i);
    const matchProxy = pathname.match(
      /\/pharmacy\/uploads\/prescriptions\/([^/?#]+)$/i,
    );
    const fileName = (matchUploads || matchProxy)?.[1];
    if (!fileName) return null;

    // Basic traversal protection.
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return null;
    }

    const filePath = join(process.cwd(), 'uploads', 'prescriptions', fileName);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const lower = fileName.toLowerCase();
      const contentType = lower.endsWith('.png')
        ? 'image/png'
        : lower.endsWith('.gif')
          ? 'image/gif'
          : lower.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg';

      const uint8 = new Uint8Array(fileBuffer);
      const arrayBuffer = uint8.buffer.slice(
        uint8.byteOffset,
        uint8.byteOffset + uint8.byteLength,
      );

      return {
        arrayBuffer,
        byteLength: uint8.byteLength,
        contentType,
        fileName,
      };
    } catch {
      return null;
    }
  }

  private resolveImageUrl(imageUrl: string): string {
    const raw = (imageUrl || '').trim();
    if (!raw) return '';

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    const publicBase = (process.env.BACKEND_PUBLIC_URL || '').trim().replace(/\/$/, '');
    if (!publicBase) {
      return raw;
    }

    if (raw.startsWith('/')) {
      return `${publicBase}${raw}`;
    }
    return `${publicBase}/${raw}`;
  }

  async extractMedicationsFromImageUrl(
    imageUrl: string,
  ): Promise<AnalyzedMedication[]> {
    const resolvedImageUrl = this.resolveImageUrl(imageUrl);

    if (!this.baseUrl || !resolvedImageUrl?.trim()) {
      return [];
    }

    const requestId = `prescription-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2, 10)}`;
    const startedAt = Date.now();
    let alreadyLoggedDetailedError = false;

    // Prefer local disk for uploaded prescriptions to avoid 404/network issues.
    const localUpload =
      (await this.tryReadLocalPrescriptionUpload(imageUrl)) ||
      (await this.tryReadLocalPrescriptionUpload(resolvedImageUrl));

    let contentType = 'application/octet-stream';
    let imageBuffer: ArrayBuffer;
    let imageBytes = 0;
    let fileName = this.extractFileName(resolvedImageUrl);

    if (localUpload) {
      contentType = localUpload.contentType;
      imageBuffer = localUpload.arrayBuffer;
      imageBytes = localUpload.byteLength;
      fileName = localUpload.fileName;
    } else {
      let imageResponse: Response;
      try {
        imageResponse = await fetch(resolvedImageUrl);
      } catch (error) {
        console.error(
          '[PrescriptionAnalysisService] Image download failed',
          this.buildLogContext({
            requestId,
            imageUrl: resolvedImageUrl,
            originalImageUrl: (imageUrl || '').trim(),
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
            imageUrl: resolvedImageUrl,
            originalImageUrl: (imageUrl || '').trim(),
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

      contentType =
        imageResponse.headers.get('content-type') ||
        'application/octet-stream';
      imageBuffer = await imageResponse.arrayBuffer();
      imageBytes = imageBuffer.byteLength;
    }
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
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
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
            imageUrl: resolvedImageUrl,
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
            imageUrl: resolvedImageUrl,
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
            imageUrl: resolvedImageUrl,
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
            imageUrl: resolvedImageUrl,
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
