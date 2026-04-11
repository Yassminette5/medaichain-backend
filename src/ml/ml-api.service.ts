import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * 2ᵉ modèle (logique du dossier ml-api) : POST …/predict-ml-api
 * Même serveur Flask que MlService (ML_SERVICE_URL), autre endpoint.
 */
@Injectable()
export class MlApiService {
  constructor(private readonly config: ConfigService) {}

  async predictLab(data: any) {
    const base =
      this.config.get<string>('ML_SERVICE_URL') || 'http://127.0.0.1:5000';
    const url = `${base.replace(/\/+$/, '')}/predict-ml-api`;

    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error: any) {
      const details =
        error?.response?.data != null
          ? JSON.stringify(error.response.data)
          : error?.message ?? String(error);
      return {
        error: 'Erreur communication avec le modèle ml-api',
        details,
      };
    }
  }
}
