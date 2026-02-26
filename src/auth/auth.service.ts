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
    AdminCreateUserDto,
    CompleteInviteDto,
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
                await this.profilesService.upsertPatientInformation(user._id.toString(), {
                    fullName: registerDto.fullName || 'Utilisateur',
                    age: 0, // Default for required field if still strict
                    gender: undefined,
                    allergies: [],
                });
            }
        } catch (error) {
            console.error(`Erreur lors de la création du profil pour le rôle ${registerDto.role}:`, error);
            // Re-throw to ensure the client knows something went wrong, 
            // but after user was created we might want to be careful.
            // However, the user says "it wasn't created", so we should throw.
            throw new BadRequestException(`La création du profil a échoué: ${error.message}`);
        }

        // Récupérer l'utilisateur à jour (avec isProfileCompleted et patientInformation)
        const updatedUser = await this.usersService.findById(user._id.toString());

        // Générer les tokens
        const tokens = await this.generateTokens(updatedUser);

        return {
            message: 'Inscription réussie',
            user: await this.sanitizeUser(updatedUser),
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

    // ========== CHANGER MOT DE PASSE ==========
    async changePassword(userId: string, changePasswordDto: {
        currentPassword: string;
        newPassword: string;
    }) {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException('Utilisateur non trouvé');
        }

        // Vérifier le mot de passe actuel
        const isPasswordValid = await bcrypt.compare(
            changePasswordDto.currentPassword,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Mot de passe actuel incorrect');
        }

        // Vérifier que le nouveau mot de passe est différent
        if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
            throw new BadRequestException(
                'Le nouveau mot de passe doit être différent du mot de passe actuel',
            );
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

        await this.usersService.update(userId, { password: hashedPassword });

        return {
            message: 'Mot de passe changé avec succès',
        };
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

    // ========== COMPLETION DE PROFIL (Invitation) ==========
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
                const fullName = dto.firstName && dto.lastName 
                    ? `${dto.firstName} ${dto.lastName}`.trim()
                    : (dto.firstName || dto.lastName || '');
                await this.profilesService.upsertDoctorProfile(userId, {
                    fullName: fullName,
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

    // ========== CRÉATION DE COMPTE PAR L'ADMIN ==========
    async createUserByAdmin(dto: AdminCreateUserDto) {
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
                const fullName = dto.firstName && dto.lastName 
                    ? `${dto.firstName} ${dto.lastName}`.trim()
                    : (dto.firstName || dto.lastName || '');
                await this.profilesService.upsertDoctorProfile(user._id.toString(), {
                    fullName: fullName,
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
            user: await this.sanitizeUser(user),
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
                    // Reference to the shared information document
                    mergedUser.patientInformation = user.patientInformation;
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
