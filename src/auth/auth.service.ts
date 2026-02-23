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
import { RegisterDto, AdminCreateUserDto, CompleteInviteDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
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
            fullName: registerDto.fullName, // Pour les patients
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
                // Pour les patients, on utilise fullName s'il est fourni
                const names = registerDto.fullName?.split(' ') || [];
                const firstName = registerDto.firstName || names[0] || '';
                const lastName = registerDto.lastName || names.slice(1).join(' ') || '';
                
                await this.profilesService.upsertPatientProfile(user._id.toString(), {
                    firstName,
                    lastName,
                    dateOfBirth: new Date(), // Valeur par défaut, sera mise à jour plus tard
                });
            } else if (registerDto.role === UserRole.CLINIQUE) {
                await this.profilesService.upsertClinicProfile(user._id.toString(), {
                    clinicName: registerDto.clinicName || '',
                    address: registerDto.address || '',
                    creationDate: registerDto.creationDate,
                    phone: registerDto.phone,
                    officialEmail: registerDto.email,
                } as any);
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

    // ========== COMPLETION DE PROFIL (Invitation) ==========
    async completeInvite(dto: CompleteInviteDto) {
        throw new BadRequestException("L'email est requis pour la finalisation (ajoutez-le au DTO ou au formulaire)");
    }

    // Helper pour la méthode réelle (avec email passé en argument ou dans DTO)
    async registerFromInvite(dto: CompleteInviteDto, email: string, role: string) {
        console.log(`[RegisterFromInvite] Tentative d'inscription pour ${email} avec le rôle ${role}`);
        // Vérifier existence
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            console.log(`[RegisterFromInvite] Email ${email} déjà existant`);
            throw new ConflictException('Cet compte existe déjà');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Créer utilisateur
        console.log(`[RegisterFromInvite] Création de l'utilisateur...`);
        let user;
        try {
            user = await this.usersService.create({
                email: email,
                password: hashedPassword,
                phone: dto.phone,
                role: role as any,
                isProfileCompleted: true, // On considère complet après ce formulaire
            });
        } catch (error) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.phone) {
                console.log(`[RegisterFromInvite] Téléphone ${dto.phone} déjà existant`);
                throw new ConflictException('Ce numéro de téléphone est déjà utilisé par un autre compte.');
            }
            throw error;
        }
        console.log(`[RegisterFromInvite] Utilisateur créé avec ID: ${user._id}`);

        // Créer profil
        await this.createProfileForRole(user._id.toString(), role, dto, email);
        console.log(`[RegisterFromInvite] Profil créé/mis à jour.`);

        return this.generateTokens(user);
    }

    private async createProfileForRole(userId: string, role: string, dto: any, email: string) {
        try {
            if (role === 'medecin') {
                await this.profilesService.upsertDoctorProfile(userId, {
                    firstName: dto.firstName || '',
                    lastName: dto.lastName || '',
                    speciality: dto.speciality || '',
                    wilaya: dto.wilaya,
                    city: dto.wilaya,
                    yearsOfExperience: dto.yearsOfExperience,
                });
            } else if (role === 'centre_analyse') {
                await this.profilesService.upsertLabProfile(userId, {
                    centreName: dto.centreName || '',
                    categorie: dto.categorie || '',
                    phone: dto.phone,
                    email: email,
                    localisation: dto.localisation || '',
                });
            } else if (role === 'pharmacie') {
                await this.profilesService.upsertPharmacyProfile(userId, {
                    pharmacyName: dto.pharmacyName || '',
                    ownerName: dto.ownerName || '',
                    licenseNumber: dto.licenseNumber || '',
                    address: dto.address || '',
                    city: dto.delegation || '',
                    wilaya: dto.gouvernorat || '',
                });
            } else if (role === 'clinique') {
                await this.profilesService.upsertClinicProfile(userId, {
                    clinicName: dto.clinicName || '',
                    address: dto.address || '',
                    creationDate: dto.creationDate,
                    phone: dto.phone,
                    officialEmail: dto.officialEmail || email,
                } as any);
            }
        } catch (error) {
            console.error('Erreur création profil:', error);
        }
    }

    // ========== INVITATION PROFESSIONNELLE ==========
    async sendInvitation(inviteDto: { email: string; role: string }) {
        // Vérifier que le rôle n'est pas patient (les patients s'inscrivent via le mobile)
        if (inviteDto.role === 'patient') {
            throw new BadRequestException('Les patients s\'inscrivent directement via l\'application mobile');
        }

        // Vérifier si l'email existe déjà
        const existingUser = await this.usersService.findByEmail(inviteDto.email);
        if (existingUser) {
            throw new ConflictException('Cet email est déjà utilisé');
        }

        // Générer un token d'invitation unique
        const inviteToken = uuidv4();

        // Envoyer l'email d'invitation
        await this.mailService.sendInvitationEmail(inviteDto.email, inviteDto.role, inviteToken);

        return {
            message: `Invitation envoyée avec succès à ${inviteDto.email}`,
            inviteToken,
            role: inviteDto.role,
        };
    }

    // ========== CRÉATION DE COMPTE PAR L'ADMIN ==========
    async createUserByAdmin(dto: any) {
        // Vérifier que le rôle n'est pas patient
        if (dto.role === 'patient') {
            throw new BadRequestException('Les patients s\'inscrivent directement via l\'application mobile');
        }

        // Vérifier si l'email existe déjà
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Cet email est déjà utilisé');
        }

        // Vérifier si le téléphone existe déjà
        const existingPhone = await this.usersService.findByPhone(dto.phone);
        if (existingPhone) {
            throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
        }

        // Générer un mot de passe aléatoire (12 caractères)
        const rawPassword = this.generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // Créer l'utilisateur
        const user = await this.usersService.create({
            email: dto.email,
            password: hashedPassword,
            phone: dto.phone,
            role: dto.role,
            isProfileCompleted: false,
        });

        // Créer le profil associé selon le rôle
        try {
            if (dto.role === UserRole.MEDECIN) {
                await this.profilesService.upsertDoctorProfile(user._id.toString(), {
                    firstName: dto.firstName || '',
                    lastName: dto.lastName || '',
                    speciality: dto.speciality || '',
                    wilaya: dto.wilaya,
                    city: dto.wilaya,
                    yearsOfExperience: dto.yearsOfExperience,
                });
            } else if (dto.role === UserRole.CENTRE_ANALYSE) {
                await this.profilesService.upsertLabProfile(user._id.toString(), {
                    centreName: dto.centreName || '',
                    categorie: dto.categorie || '',
                    phone: dto.phone,
                    email: dto.email,
                    localisation: dto.localisation || '',
                });
            } else if (dto.role === UserRole.PHARMACIE) {
                await this.profilesService.upsertPharmacyProfile(user._id.toString(), {
                    pharmacyName: dto.pharmacyName || '',
                    ownerName: dto.ownerName || '',
                    licenseNumber: dto.licenseNumber || '',
                    address: dto.address || '',
                    city: dto.delegation || '',
                    wilaya: dto.gouvernorat || '',
                });
            } else if (dto.role === UserRole.CLINIQUE) {
                await this.profilesService.upsertClinicProfile(user._id.toString(), {
                    clinicName: dto.clinicName || '',
                    address: dto.address || '',
                    creationDate: dto.creationDate,
                    phone: dto.phone,
                    officialEmail: dto.officialEmail || dto.email,
                } as any);
            }
        } catch (error) {
            console.error('Erreur lors de la création du profil', error);
        }

        // Envoyer les identifiants par email
        await this.mailService.sendCredentialsEmail(dto.email, rawPassword, dto.role);

        return {
            message: `Compte ${dto.role} créé avec succès pour ${dto.email}`,
            user: this.sanitizeUser(user),
            generatedPassword: rawPassword, // Affiché aussi dans la réponse pour l'admin
        };
    }

    private generateRandomPassword(length: number): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
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
            fullName: result.fullName,
            gender: result.gender,
            age: result.age,
            height: result.height,
            weight: result.weight,
            allergies: result.allergies,
        };
    }
}
