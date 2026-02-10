import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { MailService } from './mail.service';
import { ProfilesService } from '../profiles/profiles.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private mailService;
    private profilesService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, mailService: MailService, profilesService: ProfilesService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: any;
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: any;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getProfile(userId: string): Promise<any>;
    completeProfile(userId: string): Promise<{
        message: string;
    }>;
    private generateTokens;
    private sanitizeUser;
}
