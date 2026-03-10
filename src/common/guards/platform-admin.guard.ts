import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  private verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.PLATFORM_USER_POOL_ID || "", // Admin specific pool
    tokenUse: 'access',
    clientId: process.env.PLATFORM_APP_CLIENT_ID || "",
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException('No token provided');
    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.verifier.verify(token);

      console.log("payload::", payload)
      // We attach the cognitoSub so we can look up the DB user later
      request.user = { sub: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Admin Token');
    }
  }
}