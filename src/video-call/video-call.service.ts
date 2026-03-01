import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

@Injectable()
export class VideoCallService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Génère un token Agora RTC pour rejoindre un canal (médecin ou patient).
   * Le channelName doit être au format medaichain-{id1}-{id2} (ids triés).
   */
  getToken(channelName: string, userId: string): { appId: string; token: string; uid: number } {
    const appId = this.configService.get<string>('AGORA_APP_ID');
    const appCertificate = this.configService.get<string>('AGORA_APP_CERTIFICATE');
    if (!appId || !appCertificate) {
      throw new Error('AGORA_APP_ID et AGORA_APP_CERTIFICATE doivent être configurés dans .env');
    }
    // Uid numérique dérivé de l'userId pour être stable (même user = même uid)
    const uid = this.userIdToAgoraUid(userId);
    const expirationTimeInSeconds = 3600; // 1 heure (secondes à partir de maintenant)
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      expirationTimeInSeconds,
      expirationTimeInSeconds,
    );
    return { appId, token, uid };
  }

  /** Convertit un userId (string) en entier positif pour Agora (1 .. 2^31-1). */
  private userIdToAgoraUid(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & 0x7fffffff;
    }
    return hash > 0 ? hash : 1;
  }
}
