import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MlService {

  async predict(data: any) {
    try {
      const response = await axios.post(
        'http://localhost:5000/predict',
        data
      );

      return response.data;

    } catch (error) {
      return {
        error: 'Erreur communication avec modèle ML',
        details: error.message,
      };
    }
  }
}