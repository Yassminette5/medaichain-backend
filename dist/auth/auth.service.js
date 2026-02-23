"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const users_service_1 = require("../users/users.service");
const user_schema_1 = require("../users/schemas/user.schema");
const mail_service_1 = require("./mail.service");
const profiles_service_1 = require("../profiles/profiles.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    mailService;
    profilesService;
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
                    fullName: registerDto.fullName || '',
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
                await this.profilesService.upsertPatientInformation(user._id.toString(), {
                    fullName: registerDto.fullName || 'Utilisateur',
                    age: 0,
                    gender: undefined,
                    allergies: [],
                });
            }
        }
        catch (error) {
            console.error(`Erreur lors de la création du profil pour le rôle ${registerDto.role}:`, error);
            throw new common_1.BadRequestException(`La création du profil a échoué: ${error.message}`);
        }
        const updatedUser = await this.usersService.findById(user._id.toString());
        const tokens = await this.generateTokens(updatedUser);
        return {
            message: 'Inscription réussie',
            user: await this.sanitizeUser(updatedUser),
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
            user: await this.sanitizeUser(user),
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
        return await this.sanitizeUser(user);
    }
    async completeProfile(userId) {
        await this.usersService.markProfileCompleted(userId);
        return { message: 'Profil complété' };
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur non trouvé');
        }
        const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Mot de passe actuel incorrect');
        }
        if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
            throw new common_1.BadRequestException('Le nouveau mot de passe doit être différent du mot de passe actuel');
        }
        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.usersService.update(userId, { password: hashedPassword });
        return {
            message: 'Mot de passe changé avec succès',
        };
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
    async findUserById(userId) {
        return this.usersService.findById(userId);
    }
    async sanitizeUser(user) {
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
                const roleLower = user.role.toString().toLowerCase();
                if (roleLower === user_schema_1.UserRole.PATIENT.toString()) {
                    console.log(`[AuthService] Merging Patient data: ${pData.fullName}`);
                    mergedUser.fullName = pData.fullName || mergedUser.fullName;
                    mergedUser.gender = pData.gender;
                    mergedUser.age = pData.age;
                    mergedUser.height = pData.height;
                    mergedUser.weight = pData.weight;
                    mergedUser.allergies = pData.allergies;
                    mergedUser.patientInformation = user.patientInformation;
                }
                else if (roleLower === user_schema_1.UserRole.MEDECIN.toString()) {
                    mergedUser.fullName = pData.fullName || mergedUser.fullName;
                    mergedUser.speciality = pData.speciality;
                    mergedUser.hospital = pData.hospital;
                    mergedUser.licenseNumber = pData.licenseNumber;
                }
            }
            else {
                console.warn(`[AuthService] No profile found for user ${user.email} with role ${user.role}`);
            }
        }
        catch (e) {
            console.error('Erreur lors du merge du profil:', e);
        }
        return mergedUser;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => profiles_service_1.ProfilesService))),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService,
        profiles_service_1.ProfilesService])
], AuthService);
//# sourceMappingURL=auth.service.js.map