import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            throw new ForbiddenException('Authentification requise');
        }

        const userRole = user.role != null ? String(user.role).toLowerCase() : '';
        const hasRole = requiredRoles.some((role) => String(role).toLowerCase() === userRole);
        if (!hasRole) {
            throw new ForbiddenException(
                `Accès réservé (rôle requis : ${requiredRoles.map((r) => String(r)).join(' ou ')}). Vous êtes connecté en tant que : ${userRole || 'inconnu'}.`,
            );
        }
        return true;
    }
}
