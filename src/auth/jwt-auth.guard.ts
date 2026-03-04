import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private verifier;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.config.get<string>('COGNITO_USER_POOL_ID')!,
      tokenUse: 'access',
      clientId: this.config.get('COGNITO_CLIENT_ID'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!authHeader) throw new UnauthorizedException();

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = await this.verifier.verify(token);
      const email =
        typeof payload.email === 'string' ? payload.email.toLowerCase() : undefined;
      const cognitoSub = payload.sub;

      const actors = await this.prisma.$queryRaw<
        { id: string; userId: string; cognitoSub: string | null; email: string }[]
      >`
        SELECT
          pu.id AS "id",
          pu.user_id AS "userId",
          pu.cognito_sub AS "cognitoSub",
          u.email AS "email"
        FROM platform_users pu
        JOIN users u ON u.id = pu.user_id
        WHERE
          pu.status = true
          AND (
            pu.cognito_sub = ${cognitoSub}
            OR (${email ?? null} IS NOT NULL AND u.email = ${email ?? null})
          )
        LIMIT 1
      `;
      const actor = actors[0];

      if (!actor) {
        throw new UnauthorizedException('Authenticated user is not provisioned.');
      }

      const permissionRows = await this.prisma.$queryRaw<{ name: string }[]>`
        SELECT DISTINCT p.name
        FROM platform_user_roles pur
        JOIN platform_role_permissions prp
          ON prp.platform_role_id = pur.platform_role_id
        JOIN platform_permissions p
          ON p.id = prp.platform_permission_id
        WHERE pur.user_id = ${actor.id}
      `;
      const permissions = permissionRows.map((row) => row.name);

      const hasAllRequiredPermissions = requiredPermissions.every((required) =>
        permissions.includes(required),
      );

      if (!hasAllRequiredPermissions) {
        throw new ForbiddenException('Insufficient permissions.');
      }

      // Attach user to request
      request.user = {
        id: actor.id,
        userId: actor.userId,
        cognitoSub,
        email: actor.email,
        permissions,
      };

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
