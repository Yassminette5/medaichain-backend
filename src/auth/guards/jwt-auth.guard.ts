import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    // Le mode démo a été retiré. AuthGuard('jwt') va valider le token
    // et injecter le vrai request.user provenant de jwt.strategy.ts.
}
