import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        // Mode démo : autoriser temporairement toutes les requêtes pour la soutenance (Clinic + Patient)
        // Les routes backend seront accessibles sans validation de token stricte.
        const request = context.switchToHttp().getRequest();

        // Mock user pour que les requêtes nécessitant un profil/patient marchent
        request.user = {
            userId: '699a416b9ace32950b31d533', // Static patient/clinic ID if needed by logic
            role: 'clinique'
        };

        return true;
    }
}
