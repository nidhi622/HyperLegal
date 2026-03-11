import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  private verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.PLATFORM_USER_POOL_ID || '', // Admin specific pool
    tokenUse: 'access',
    clientId: process.env.PLATFORM_APP_CLIENT_ID || '',
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log("authorization:: ", authHeader)

    if (!authHeader) throw new UnauthorizedException('No token provided');
    const token = authHeader.split(' ')[1];

    console.log("token", token)

    try {
      console.log("verfier: ", this.verifier)
      const payload = await this.verifier.verify(token);

      console.log('payload::', payload);
      // We attach the cognitoSub so we can look up the DB user later
      request.user = { sub: payload.sub, email: payload.email };

      console.log("USER:::", request.user)
      return true;
    } catch (err:any){
      console.log("err:: ",err)
      throw new UnauthorizedException('Invalid Token');
    }
  }
}
