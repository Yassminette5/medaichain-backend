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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const uuid_1 = require("uuid");
const users_service_1 = require("../users/users.service");
const user_schema_1 = require("../users/schemas/user.schema");
const mail_service_1 = require("./mail.service");
const profiles_service_1 = require("../profiles/profiles.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, mailService, profilesService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
        this.profilesService = profilesService;
    }
    async register(registerDto) {
        const existingEmail = await this.usersService.findByEmail(registerDto.email);
        if (existingEmail) {
            throw new common_1.ConflictException('Cet email est déjà utilisé');
        }
        const existingPhone = await this.usersService.findByPhone(registerDto.phone);
        if (existingPhone) {
            throw new common_1.ConflictException('Ce numéro de téléphone est déjà utilisé');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            email: registerDto.email,
            password: hashedPassword,
            phone: registerDto.phone,
            role: registerDto.role,
            isProfileCompleted: false,
        });
        try {
            if (registerDto.role === user_schema_1.UserRole.MEDECIN) {
                await this.profilesService.upsertDoctorProfile(user._id.toString(), {
                    firstName: registerDto.firstName || '',
                    lastName: registerDto.lastName || '',
                    speciality: registerDto.speciality || '',
                    wilaya: registerDto.wilaya,
                    city: registerDto.wilaya,
                    yearsOfExperience: registerDto.yearsOfExperience,
                });
            }
            else if (registerDto.role === user_schema_1.UserRole.CENTRE_ANALYSE) {
                await this.profilesService.upsertLabProfile(user._id.toString(), {
                    centreName: registerDto.centreName || '',
                    categorie: registerDto.categorie || '',
                    phone: registerDto.phone,
                    email: registerDto.email,
                    localisation: registerDto.localisation || '',
                });
            }
            else if (registerDto.role === user_schema_1.UserRole.PHARMACIE) {
                await this.profilesService.upsertPharmacyProfile(user._id.toString(), {
                    pharmacyName: registerDto.pharmacyName || '',
                    ownerName: registerDto.ownerName || '',
                    licenseNumber: registerDto.licenseNumber || '',
                    address: registerDto.address || '',
                    city: registerDto.delegation || '',
                    wilaya: registerDto.gouvernorat || '',
                });
            }
            else if (registerDto.role === user_schema_1.UserRole.PATIENT) {
                await this.profilesService.upsertPatientProfile(user._id.toString(), {
                    firstName: registerDto.firstName || '',
                    lastName: registerDto.lastName || '',
                });
            }
        }
        catch (error) {
            console.error('Erreur lors de la création du profil', error);
        }
        const tokens = await this.generateTokens(user);
        return {
            message: 'Inscription réussie',
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async login(loginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Compte désactivé');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        await this.usersService.updateLastLogin(user._id.toString());
        const tokens = await this.generateTokens(user);
        return {
            message: 'Connexion réussie',
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async forgotPassword(forgotPasswordDto) {
        const user = await this.usersService.findByEmail(forgotPasswordDto.email);
        if (!user) {
            return {
                message: 'Si cet email existe, un code a été envoyé',
            };
        }
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 3600000);
        await this.usersService.setResetPasswordToken(user._id.toString(), resetCode, expires);
        await this.mailService.sendPasswordResetEmail(user.email, resetCode);
        return {
            message: 'Si cet email existe, un code a été envoyé',
        };
    }
    async resetPassword(resetPasswordDto) {
        const user = await this.usersService.findByResetToken(resetPasswordDto.token);
        if (!user) {
            throw new common_1.BadRequestException('Token invalide ou expiré');
        }
        if (user.resetPasswordExpires < new Date()) {
            throw new common_1.BadRequestException('Token expiré');
        }
        const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
        await this.usersService.update(user._id.toString(), { password: hashedPassword });
        await this.usersService.clearResetToken(user._id.toString());
        return {
            message: 'Mot de passe réinitialisé avec succès',
        };
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.usersService.findById(payload.sub);
            const tokens = await this.generateTokens(user);
            return tokens;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Token de rafraîchissement invalide');
        }
    }
    async getProfile(userId) {
        const user = await this.usersService.findById(userId);
        return this.sanitizeUser(user);
    }
    async completeProfile(userId) {
        await this.usersService.markProfileCompleted(userId);
        return { message: 'Profil complété' };
    }
    async completeInvite(dto) {
        throw new common_1.BadRequestException("L'email est requis pour la finalisation (ajoutez-le au DTO ou au formulaire)");
    }
    async registerFromInvite(dto, email, role) {
        console.log(`[RegisterFromInvite] Tentative d'inscription pour ${email} avec le rôle ${role}`);
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            console.log(`[RegisterFromInvite] Email ${email} déjà existant`);
            throw new common_1.ConflictException('Cet compte existe déjà');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        console.log(`[RegisterFromInvite] Création de l'utilisateur...`);
        let user;
        try {
            user = await this.usersService.create({
                email: email,
                password: hashedPassword,
                phone: dto.phone,
                role: role,
                isProfileCompleted: true,
            });
        }
        catch (error) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.phone) {
                console.log(`[RegisterFromInvite] Téléphone ${dto.phone} déjà existant`);
                throw new common_1.ConflictException('Ce numéro de téléphone est déjà utilisé par un autre compte.');
            }
            throw error;
        }
        console.log(`[RegisterFromInvite] Utilisateur créé avec ID: ${user._id}`);
        await this.createProfileForRole(user._id.toString(), role, dto, email);
        console.log(`[RegisterFromInvite] Profil créé/mis à jour.`);
        return this.generateTokens(user);
    }
    async createProfileForRole(userId, role, dto, email) {
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
            }
            else if (role === 'centre_analyse') {
                await this.profilesService.upsertLabProfile(userId, {
                    centreName: dto.centreName || '',
                    categorie: dto.categorie || '',
                    phone: dto.phone,
                    email: email,
                    localisation: dto.localisation || '',
                });
            }
            else if (role === 'pharmacie') {
                await this.profilesService.upsertPharmacyProfile(userId, {
                    pharmacyName: dto.pharmacyName || '',
                    ownerName: dto.ownerName || '',
                    licenseNumber: dto.licenseNumber || '',
                    address: dto.address || '',
                    city: dto.delegation || '',
                    wilaya: dto.gouvernorat || '',
                });
            }
        }
        catch (error) {
            console.error('Erreur création profil:', error);
        }
    }
    async sendInvitation(inviteDto) {
        if (inviteDto.role === 'patient') {
            throw new common_1.BadRequestException('Les patients s\'inscrivent directement via l\'application mobile');
        }
        const existingUser = await this.usersService.findByEmail(inviteDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('Cet email est déjà utilisé');
        }
        const inviteToken = (0, uuid_1.v4)();
        await this.mailService.sendInvitationEmail(inviteDto.email, inviteDto.role, inviteToken);
        return {
            message: `Invitation envoyée avec succès à ${inviteDto.email}`,
            inviteToken,
            role: inviteDto.role,
        };
    }
    async createUserByAdmin(dto) {
        if (dto.role === 'patient') {
            throw new common_1.BadRequestException('Les patients s\'inscrivent directement via l\'application mobile');
        }
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new common_1.ConflictException('Cet email est déjà utilisé');
        }
        const existingPhone = await this.usersService.findByPhone(dto.phone);
        if (existingPhone) {
            throw new common_1.ConflictException('Ce numéro de téléphone est déjà utilisé');
        }
        const rawPassword = this.generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const user = await this.usersService.create({
            email: dto.email,
            password: hashedPassword,
            phone: dto.phone,
            role: dto.role,
            isProfileCompleted: false,
        });
        try {
            if (dto.role === user_schema_1.UserRole.MEDECIN) {
                await this.profilesService.upsertDoctorProfile(user._id.toString(), {
                    firstName: dto.firstName || '',
                    lastName: dto.lastName || '',
                    speciality: dto.speciality || '',
                    wilaya: dto.wilaya,
                    city: dto.wilaya,
                    yearsOfExperience: dto.yearsOfExperience,
                });
            }
            else if (dto.role === user_schema_1.UserRole.CENTRE_ANALYSE) {
                await this.profilesService.upsertLabProfile(user._id.toString(), {
                    centreName: dto.centreName || '',
                    categorie: dto.categorie || '',
                    phone: dto.phone,
                    email: dto.email,
                    localisation: dto.localisation || '',
                });
            }
            else if (dto.role === user_schema_1.UserRole.PHARMACIE) {
                await this.profilesService.upsertPharmacyProfile(user._id.toString(), {
                    pharmacyName: dto.pharmacyName || '',
                    ownerName: dto.ownerName || '',
                    licenseNumber: dto.licenseNumber || '',
                    address: dto.address || '',
                    city: dto.delegation || '',
                    wilaya: dto.gouvernorat || '',
                });
            }
        }
        catch (error) {
            console.error('Erreur lors de la création du profil', error);
        }
        await this.mailService.sendCredentialsEmail(dto.email, rawPassword, dto.role);
        return {
            message: `Compte ${dto.role} créé avec succès pour ${dto.email}`,
            user: this.sanitizeUser(user),
            generatedPassword: rawPassword,
        };
    }
    generateRandomPassword(length) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    async generateTokens(user) {
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
    sanitizeUser(user) {
        const userObj = user.toObject();
        const { password, resetPasswordToken, resetPasswordExpires, ...result } = userObj;
        return {
            ...result,
            id: result._id.toString(),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService,
        profiles_service_1.ProfilesService])
], AuthService);
//# sourceMappingURL=auth.service.js.map