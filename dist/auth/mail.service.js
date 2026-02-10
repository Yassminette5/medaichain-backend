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
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map