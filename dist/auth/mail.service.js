"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let MailService = class MailService {
    constructor(configService) {
        this.configService = configService;
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
    async sendPasswordResetEmail(email, code) {
        console.log('');
        console.log('='.repeat(60));
        console.log('🔐 CODE DE RÉINITIALISATION DE MOT DE PASSE');
        console.log('='.repeat(60));
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Code: ${code}`);
        console.log('='.repeat(60));
        console.log('');
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
        }
        catch (error) {
            console.error('❌ Erreur envoi email:', error.message);
        }
    }
    async sendInvitationEmail(email, role, inviteToken) {
        const roleLabels = {
            medecin: 'Médecin',
            centre_analyse: "Centre d'Analyse",
            pharmacie: 'Pharmacie',
            clinique: 'Clinique',
        };
        const roleLabel = roleLabels[role] || role;
        const signupLink = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/signup.html?token=${inviteToken}&role=${role}&email=${encodeURIComponent(email)}`;
        console.log('');
        console.log('='.repeat(60));
        console.log('📩 INVITATION PROFESSIONNELLE');
        console.log('='.repeat(60));
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Rôle: ${roleLabel}`);
        console.log(`🔗 Lien: ${signupLink}`);
        console.log(`🔑 Token: ${inviteToken}`);
        console.log('='.repeat(60));
        console.log('');
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
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Plateforme médicale sécurisée</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Vous êtes invité(e) à rejoindre MEDAIChain</h2>
              <p style="color: #666; font-size: 16px;">
                Vous avez été invité(e) à créer un compte <strong>${roleLabel}</strong> sur MEDAIChain.
              </p>
              <p style="color: #666; font-size: 16px;">
                Cliquez sur le bouton ci-dessous pour compléter votre inscription :
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signupLink}"
                   style="background: linear-gradient(135deg, #00BFA6, #536DFE);
                          color: white;
                          padding: 16px 40px;
                          font-size: 18px;
                          font-weight: bold;
                          border-radius: 12px;
                          text-decoration: none;
                          display: inline-block;">
                  Créer mon compte ${roleLabel}
                </a>
              </div>
              <p style="color: #999; font-size: 14px;">
                Ce lien est valable 7 jours. Si vous n'avez pas demandé cette
                invitation, ignorez cet email.
              </p>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              © 2026 MEDAIChain - Application médicale sécurisée
            </div>
          </div>
        `,
            });
            console.log('✅ Email d\'invitation envoyé avec succès à', email);
        }
        catch (error) {
            console.error('❌ Erreur envoi email d\'invitation:', error.message);
        }
    }
    async sendCredentialsEmail(email, password, role) {
        const roleLabels = {
            medecin: 'Médecin',
            centre_analyse: "Centre d'Analyse",
            pharmacie: 'Pharmacie',
            clinique: 'Clinique',
        };
        const roleLabel = roleLabels[role] || role;
        console.log('');
        console.log('='.repeat(60));
        console.log('🆕 COMPTE CRÉÉ PAR L\'ADMIN');
        console.log('='.repeat(60));
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Mot de passe: ${password}`);
        console.log(`👤 Rôle: ${roleLabel}`);
        console.log('='.repeat(60));
        console.log('');
        const smtpHost = this.configService.get('SMTP_HOST');
        if (!smtpHost || smtpHost === 'smtp.example.com') {
            console.log('⚠️  SMTP non configuré - email non envoyé (mode développement)');
            return;
        }
        try {
            await this.transporter.sendMail({
                from: '"MEDAIChain" <noreply@medaichain.com>',
                to: email,
                subject: `Vos identifiants MEDAIChain - Compte ${roleLabel}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #00BFA6, #536DFE); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">MEDAIChain</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Plateforme médicale sécurisée</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Bienvenue sur MEDAIChain !</h2>
              <p style="color: #666; font-size: 16px;">
                Votre compte <strong>${roleLabel}</strong> a été créé. Voici vos identifiants de connexion :
              </p>
              <div style="background: white; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e0e0e0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px; color: #666; font-size: 14px; border-bottom: 1px solid #f0f0f0;">📧 Email</td>
                    <td style="padding: 12px; color: #333; font-size: 16px; font-weight: bold; border-bottom: 1px solid #f0f0f0;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; color: #666; font-size: 14px;">🔑 Mot de passe</td>
                    <td style="padding: 12px; color: #333; font-size: 16px; font-weight: bold; font-family: monospace; letter-spacing: 1px;">${password}</td>
                  </tr>
                </table>
              </div>
              <p style="color: #e74c3c; font-size: 14px; font-weight: bold;">
                ⚠️ Veuillez changer votre mot de passe après votre première connexion.
              </p>
              <p style="color: #999; font-size: 14px;">
                Connectez-vous via l'application mobile MEDAIChain avec ces identifiants.
              </p>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              © 2026 MEDAIChain - Application médicale sécurisée
            </div>
          </div>
        `,
            });
            console.log('✅ Email d\'identifiants envoyé avec succès à', email);
        }
        catch (error) {
            console.error('❌ Erreur envoi email d\'identifiants:', error.message);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map