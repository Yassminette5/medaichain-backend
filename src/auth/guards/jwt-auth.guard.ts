import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        // Mode démo : autoriser toutes les requêtes sans JWT
        // En production, il faudrait valider le token JWT
        const request = context.switchToHttp().getRequest();
        request.user = { userId: 'demo', role: 'admin' };
        return true;
    }
}
