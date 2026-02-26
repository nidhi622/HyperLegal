import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private verifier;

  constructor(private config: ConfigService) {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.config.get<string>('COGNITO_USER_POOL_ID')!,
      tokenUse: 'access',
      clientId: this.config.get('COGNITO_CLIENT_ID'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException();

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = await this.verifier.verify(token);

      // Attach user to request
      request.user = {
        userId: payload.sub,
        email: payload.email,
        tenantId: payload['custom:tenant_id'],
        role: payload['custom:role'],
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
