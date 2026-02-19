import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, InviteDto, AdminCreateUserDto, CompleteInviteDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getProfile(req: any): Promise<any>;
    completeProfile(req: any): Promise<{
        message: string;
    }>;
    sendInvitation(inviteDto: InviteDto): Promise<{
        message: string;
        inviteToken: any;
        role: string;
    }>;
    adminInvite(inviteDto: InviteDto): Promise<{
        message: string;
        inviteToken: any;
        role: string;
    }>;
    completeInvite(dto: CompleteInviteDto, email: string, role: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    adminCreateUser(dto: AdminCreateUserDto): Promise<{
        message: string;
        user: any;
        generatedPassword: string;
    }>;
}
