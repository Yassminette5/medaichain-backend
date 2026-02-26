import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Query,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    RefreshTokenDto,
    InviteDto,
    AdminCreateUserDto,
    CompleteInviteDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
    @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
    @ApiResponse({ status: 409, description: 'Email ou téléphone déjà utilisé' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Connexion utilisateur' })
    @ApiResponse({ status: 200, description: 'Connexion réussie' })
    @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Demande de réinitialisation du mot de passe' })
    @ApiResponse({ status: 200, description: 'Email envoyé si compte existe' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Réinitialiser le mot de passe avec le token' })
    @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé' })
    @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
    @ApiResponse({ status: 200, description: 'Nouveaux tokens générés' })
    @ApiResponse({ status: 401, description: 'Token de rafraîchissement invalide' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Obtenir le profil de l\'utilisateur connecté' })
    @ApiResponse({ status: 200, description: 'Profil utilisateur' })
    @ApiResponse({ status: 401, description: 'Non autorisé' })
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.sub || req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('complete-profile')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Marquer le profil comme complété' })
    @ApiResponse({ status: 200, description: 'Profil complété' })
    async completeProfile(@Request() req) {
        return this.authService.completeProfile(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Changer le mot de passe' })
    @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
    @ApiResponse({ status: 401, description: 'Mot de passe actuel incorrect' })
    async changePassword(
        @Request() req,
        @Body() changePasswordDto: { currentPassword: string; newPassword: string },
    ) {
        return this.authService.changePassword(req.user.sub, changePasswordDto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('invite')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Envoyer une invitation par email à un professionnel' })
    @ApiResponse({ status: 200, description: 'Invitation envoyée avec succès' })
    @ApiResponse({ status: 400, description: 'Rôle invalide (patient non autorisé)' })
    @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
    async sendInvitation(@Body() inviteDto: InviteDto) {
        return this.authService.sendInvitation(inviteDto);
    }

    @Post('admin/invite')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Envoyer une invitation (Dashboard Admin)' })
    @ApiResponse({ status: 200, description: 'Invitation envoyée' })
    async adminInvite(@Body() inviteDto: InviteDto) {
        return this.authService.sendInvitation(inviteDto);
    }

    @Post('complete-invite')
    @ApiOperation({ summary: 'Finaliser l\'inscription via invitation' })
    @ApiResponse({ status: 201, description: 'Compte créé avec succès' })
    async completeInvite(
        @Body() dto: CompleteInviteDto,
        @Query('email') email: string,
        @Query('role') role: string,
    ) {
        if (!email || !role) {
            throw new BadRequestException('Email et Role sont requis');
        }
        return this.authService.registerFromInvite(dto, email, role);
    }

    @Post('admin/create-user')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Créer un compte utilisateur par l\'admin' })
    @ApiResponse({ status: 201, description: 'Compte créé et identifiants envoyés par email' })
    @ApiResponse({ status: 400, description: 'Rôle patient non autorisé' })
    @ApiResponse({ status: 409, description: 'Email ou téléphone déjà utilisé' })
    async adminCreateUser(@Body() dto: AdminCreateUserDto) {
        return this.authService.createUserByAdmin(dto);
    }
}
