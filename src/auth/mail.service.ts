import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: +this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, code: string): Promise<void> {
    // Mode développement : afficher le code dans la console
    console.log('');
    console.log('='.repeat(60));
    console.log('🔐 CODE DE RÉINITIALISATION DE MOT DE PASSE');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Code: ${code}`);
    console.log('='.repeat(60));
    console.log('');

    // Vérifier si SMTP est configuré
    const smtpHost = this.configService.get('SMTP_HOST');
    if (!smtpHost || smtpHost === 'smtp.example.com') {
      console.log('⚠️  SMTP non configuré - email non envoyé (mode développement)');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: '"MEDAIChain" <noreply@medaichain.com>',
        to: email,
        subject: 'Votre code de réinitialisation - MEDAIChain',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #00BFA6, #536DFE); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">MEDAIChain</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
              <p style="color: #666; font-size: 16px;">
                Voici votre code de réinitialisation :
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: linear-gradient(135deg, #00BFA6, #536DFE);
                            color: white;
                            padding: 20px 40px;
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            border-radius: 12px;
                            display: inline-block;">
                  ${code}
                </div>
              </div>
              <p style="color: #999; font-size: 14px;">
                Ce code expire dans 1 heure. Si vous n'avez pas demandé cette 
                réinitialisation, ignorez cet email.
              </p>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              © 2026 MEDAIChain - Application médicale sécurisée
            </div>
          </div>
        `,
      });
      console.log('✅ Email envoyé avec succès à', email);
    } catch (error) {
      console.error('❌ Erreur envoi email:', error.message);
      // Ne pas bloquer le processus si l'email échoue
    }
  }
}
