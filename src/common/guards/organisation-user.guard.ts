import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

@Injectable()
export class OrganisationUserGuard implements CanActivate {
  private verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.ORGANISATION_USER_POOL_ID || '',
    tokenUse: 'access',
    clientId: process.env.ORGANISATION_APP_CLIENT_ID || '',
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException('No token provided');
    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.verifier.verify(token);
      request.user = { sub: payload.sub, email: payload.email };
      return true;
    } catch (err: any) {
      const name = err?.name ?? err?.constructor?.name ?? '';
      const message = err?.message ?? '';

      if (
        name === 'JwtExpiredError' ||
        name === 'TokenExpiredError' ||
        message.includes('Token expired')
      ) {
        throw new UnauthorizedException('Token expired');
      }

      throw new UnauthorizedException('Invalid token');
    }
  }
}
