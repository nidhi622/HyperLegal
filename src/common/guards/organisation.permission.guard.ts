import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/database';

@Injectable()
export class OrganisationPermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const cognitoSub = request.user.sub;

    const orgUser = await this.prisma.organisationUser.findUnique({
      where: { cognitoSub },
      include: {
        user: {
          include: {
            organisationUserRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: true },
                    },
                  },
                },
                organisation: true,
              },
            },
          },
        },
      },
    });

    if (!orgUser) {
      throw new NotFoundException('Organisation user not found in database.');
    }

    const userPermissions = orgUser.user.organisationUserRoles.flatMap(
      (userRole) =>
        userRole.role.rolePermissions.map((rp) => rp.permission.name),
    );

    if (!userPermissions.includes(requiredPermission)) {
      throw new ForbiddenException(
        `You do not have the required permission: ${requiredPermission}`,
      );
    }

    request.user.dbId = orgUser.userId;
    return true;
  }
}
