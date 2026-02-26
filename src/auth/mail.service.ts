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

  async sendInvitationEmail(email: string, role: string, inviteToken: string): Promise<void> {
    const roleLabels: Record<string, string> = {
      medecin: 'Médecin',
      centre_analyse: "Centre d'Analyse",
      pharmacie: 'Pharmacie',
      clinique: 'Clinique',
    };
    const roleLabel = roleLabels[role] || role;
    const signupLink = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/signup.html?token=${inviteToken}&role=${role}&email=${encodeURIComponent(email)}`;

    // Mode développement : afficher dans la console
    console.log('');
    console.log('='.repeat(60));
    console.log('📧 EMAIL D\'INVITATION');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Rôle: ${roleLabel}`);
    console.log(`🔗 Lien d'inscription: ${signupLink}`);
    console.log(`🔑 Token: ${inviteToken}`);
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
        subject: `Invitation à rejoindre MEDAIChain en tant que ${roleLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #00BFA6, #536DFE); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">MEDAIChain</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Invitation à rejoindre MEDAIChain</h2>
              <p style="color: #666; font-size: 16px;">
                Vous avez été invité à rejoindre MEDAIChain en tant que <strong>${roleLabel}</strong>.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signupLink}" style="background: linear-gradient(135deg, #00BFA6, #536DFE);
                            color: white;
                            padding: 15px 40px;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: bold;
                            display: inline-block;">
                  Finaliser mon inscription
                </a>
              </div>
              <p style="color: #999; font-size: 14px;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <span style="color: #536DFE;">${signupLink}</span>
              </p>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              © 2026 MEDAIChain - Application médicale sécurisée
            </div>
          </div>
        `,
      });
      console.log('✅ Email d\'invitation envoyé avec succès à', email);
    } catch (error) {
      console.error('❌ Erreur envoi email d\'invitation:', error.message);
    }
  }

  async sendCredentialsEmail(email: string, password: string, role: string): Promise<void> {
    const roleLabels: Record<string, string> = {
      medecin: 'Médecin',
      centre_analyse: "Centre d'Analyse",
      pharmacie: 'Pharmacie',
      clinique: 'Clinique',
    };
    const roleLabel = roleLabels[role] || role;

    // Mode développement : afficher dans la console
    console.log('');
    console.log('='.repeat(60));
    console.log('📧 EMAIL D\'IDENTIFIANTS');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Rôle: ${roleLabel}`);
    console.log(`🔑 Mot de passe: ${password}`);
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
        subject: `Vos identifiants MEDAIChain - ${roleLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #00BFA6, #536DFE); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">MEDAIChain</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Votre compte a été créé</h2>
              <p style="color: #666; font-size: 16px;">
                Votre compte <strong>${roleLabel}</strong> a été créé avec succès. Voici vos identifiants :
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>Email :</strong> ${email}</p>
                <p style="margin: 10px 0;"><strong>Mot de passe :</strong> ${password}</p>
              </div>
              <p style="color: #ff6b6b; font-size: 14px; font-weight: bold;">
                ⚠️ Veuillez changer ce mot de passe après votre première connexion.
              </p>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              © 2026 MEDAIChain - Application médicale sécurisée
            </div>
          </div>
        `,
      });
      console.log('✅ Email d\'identifiants envoyé avec succès à', email);
    } catch (error) {
      console.error('❌ Erreur envoi email d\'identifiants:', error.message);
    }
  }
}
