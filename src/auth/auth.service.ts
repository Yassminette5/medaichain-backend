import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    Inject,
    forwardRef,
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
        @Inject(forwardRef(() => ProfilesService))
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
                    fullName: registerDto.fullName || '',
                    speciality: registerDto.speciality || '',
                    wilaya: registerDto.wilaya,
                    city: registerDto.wilaya, // Mapper wilaya vers city pour l'instant
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
                    ownerName: '',
                    licenseNumber: registerDto.licenseNumber || '',
                    address: registerDto.address || '',
                    city: registerDto.delegation || '',
                    wilaya: registerDto.gouvernorat || '',
                });
            } else if (registerDto.role === UserRole.PATIENT) {
                await this.profilesService.upsertPatientProfile(user._id.toString(), {
                    fullName: registerDto.fullName || 'Utilisateur',
                    age: 0, // Default for required field if still strict
                    gender: null,
                    allergies: [],
                });
            }
        } catch (error) {
            console.error(`Erreur lors de la création du profil pour le rôle ${registerDto.role}:`, error);
            // Optionally: throw error if profile is critical
            // throw new BadRequestException('La création du profil a échoué');
        }

        // Générer les tokens
        const tokens = await this.generateTokens(user);

        return {
            message: 'Inscription réussie',
            user: await this.sanitizeUser(user),
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
            user: await this.sanitizeUser(user),
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
        return await this.sanitizeUser(user);
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

    // ========== FIND USER BY ID ==========
    async findUserById(userId: string) {
        return this.usersService.findById(userId);
    }

    private async sanitizeUser(user: UserDocument) {
        const userObj = user.toObject();
        const { password, resetPasswordToken, resetPasswordExpires, ...result } = userObj;
        console.log(`[AuthService] Sanitizing user: ${result.email}, role: ${result.role} (type: ${typeof result.role})`);

        const mergedUser = {
            ...result,
            id: result._id.toString(),
            fullName: null,
            gender: null,
            age: null,
            height: null,
            weight: null,
            allergies: null,
            speciality: null,
            hospital: null,
            licenseNumber: null,
        };

        try {
            const profile = await this.profilesService.getProfile(user._id.toString(), user.role);
            if (profile) {
                console.log(`[AuthService] Profile found for user ${user.email}, merging...`);
                const pData = profile.toObject ? profile.toObject() : profile;

                // Explicitly merge known profile fields based on role
                const roleLower = user.role.toString().toLowerCase();
                if (roleLower === UserRole.PATIENT.toString()) {
                    console.log(`[AuthService] Merging Patient data: ${pData.fullName}`);
                    mergedUser.fullName = pData.fullName || mergedUser.fullName;
                    mergedUser.gender = pData.gender;
                    mergedUser.age = pData.age;
                    mergedUser.height = pData.height;
                    mergedUser.weight = pData.weight;
                    mergedUser.allergies = pData.allergies;
                } else if (roleLower === UserRole.MEDECIN.toString()) {
                    mergedUser.fullName = pData.fullName || mergedUser.fullName;
                    mergedUser.speciality = pData.speciality;
                    mergedUser.hospital = pData.hospital;
                    mergedUser.licenseNumber = pData.licenseNumber;
                }
                // Add other roles as needed
            } else {
                console.warn(`[AuthService] No profile found for user ${user.email} with role ${user.role}`);
            }
        } catch (e) {
            console.error('Erreur lors du merge du profil:', e);
        }

        return mergedUser;
    }
}
