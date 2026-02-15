import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
} from './dto/auth.dto';
import { MailService } from './mail.service';

import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailService,
        private profilesService: ProfilesService,
    ) { }

    // ========== INSCRIPTION ==========
    async register(registerDto: RegisterDto) {
        // Vérifier si l'email existe
        const existingEmail = await this.usersService.findByEmail(registerDto.email);
        if (existingEmail) {
            throw new ConflictException('Cet email est déjà utilisé');
        }

        // Vérifier si le téléphone existe
        const existingPhone = await this.usersService.findByPhone(registerDto.phone);
        if (existingPhone) {
            throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        // Créer l'utilisateur
        const user = await this.usersService.create({
            email: registerDto.email,
            password: hashedPassword,
            phone: registerDto.phone,
            role: registerDto.role,
            isProfileCompleted: false, // Sera mis à true après création du profil
        });

        // Créer le profil associé
        try {
            if (registerDto.role === UserRole.MEDECIN) {
                await this.profilesService.upsertDoctorProfile(user._id.toString(), {
                    firstName: registerDto.firstName || '',
                    lastName: registerDto.lastName || '',
                    speciality: registerDto.speciality || '',
                    wilaya: registerDto.wilaya,
                    city: registerDto.wilaya, // Mapper wilaya vers city pour l'instant
                    yearsOfExperience: registerDto.yearsOfExperience,
                });
            } else if (registerDto.role === UserRole.CENTRE_ANALYSE) {
                await this.profilesService.upsertLabProfile(user._id.toString(), {
                    centreName: registerDto.centreName || '',
                    categorie: registerDto.categorie || '',
                    phone: registerDto.phone,
                    email: registerDto.email,
                    localisation: registerDto.localisation || '',
                });
            } else if (registerDto.role === UserRole.PHARMACIE) {
                await this.profilesService.upsertPharmacyProfile(user._id.toString(), {
                    pharmacyName: registerDto.pharmacyName || '',
                    ownerName: registerDto.ownerName || '',
                    licenseNumber: registerDto.licenseNumber || '',
                    address: registerDto.address || '',
                    city: registerDto.delegation || '',
                    wilaya: registerDto.gouvernorat || '',
                });
            } else if (registerDto.role === UserRole.PATIENT) {
                await this.profilesService.upsertPatientProfile(user._id.toString(), {
                    firstName: registerDto.firstName || '',
                    lastName: registerDto.lastName || '',
                });
            }
        } catch (error) {
            // En cas d'erreur de création de profil, on pourrait supprimer l'user ou juste loguer
            console.error('Erreur lors de la création du profil', error);
        }

        // Générer les tokens
        const tokens = await this.generateTokens(user);

        return {
            message: 'Inscription réussie',
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    // ========== CONNEXION ==========
    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);

        if (!user) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Compte désactivé');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        // Mettre à jour la date de dernière connexion
        await this.usersService.updateLastLogin(user._id.toString());

        // Générer les tokens
        const tokens = await this.generateTokens(user);

        return {
            message: 'Connexion réussie',
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    // ========== MOT DE PASSE OUBLIÉ ==========
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const user = await this.usersService.findByEmail(forgotPasswordDto.email);

        if (!user) {
            // Ne pas révéler si l'email existe ou non (sécurité)
            return {
                message: 'Si cet email existe, un code a été envoyé',
            };
        }

        // Générer un code à 6 chiffres
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 3600000); // 1 heure

        await this.usersService.setResetPasswordToken(user._id.toString(), resetCode, expires);

        // Envoyer l'email avec le code
        await this.mailService.sendPasswordResetEmail(user.email, resetCode);

        return {
            message: 'Si cet email existe, un code a été envoyé',
        };
    }

    // ========== RÉINITIALISER MOT DE PASSE ==========
    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const user = await this.usersService.findByResetToken(resetPasswordDto.token);

        if (!user) {
            throw new BadRequestException('Token invalide ou expiré');
        }

        if (user.resetPasswordExpires < new Date()) {
            throw new BadRequestException('Token expiré');
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

        await this.usersService.update(user._id.toString(), { password: hashedPassword });
        await this.usersService.clearResetToken(user._id.toString());

        return {
            message: 'Mot de passe réinitialisé avec succès',
        };
    }

    // ========== RAFRAÎCHIR TOKEN ==========
    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });

            const user = await this.usersService.findById(payload.sub);
            const tokens = await this.generateTokens(user);

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Token de rafraîchissement invalide');
        }
    }

    // ========== PROFIL UTILISATEUR ==========
    async getProfile(userId: string) {
        const user = await this.usersService.findById(userId);
        return this.sanitizeUser(user);
    }

    // ========== COMPLÉTER LE PROFIL ==========
    async completeProfile(userId: string) {
        await this.usersService.markProfileCompleted(userId);
        return { message: 'Profil complété' };
    }

    // ========== HELPERS ==========
    private async generateTokens(user: UserDocument) {
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRES_IN'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private sanitizeUser(user: UserDocument) {
        const userObj = user.toObject();
        const { password, resetPasswordToken, resetPasswordExpires, ...result } = userObj;
        return {
            ...result,
            id: result._id.toString(),
        };
    }
}
