import { UserRole } from '../../users/schemas/user.schema';
export declare class RegisterDto {
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    speciality?: string;
    hospital?: string;
    licenseNumber?: string;
    wilaya?: string;
    yearsOfExperience?: number;
    centreName?: string;
    categorie?: string;
    localisation?: string;
    pharmacyName?: string;
    ownerName?: string;
    gouvernorat?: string;
    delegation?: string;
    address?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
