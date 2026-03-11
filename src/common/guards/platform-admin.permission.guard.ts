import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/database';


@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const cognitoSub = request.user.sub;

    console.log("requets::: ", request.user)
    console.log("requiredPermission:", requiredPermission)

    // Check-First: Find PlatformUser and their specific nested permissions
    const platformUser = await this.prisma.platformUser.findUnique({
      where: { cognitoSub },
      include: {
        user: {
          include: {
            platformUserRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log("platfoemUser: ",platformUser)
    if (!platformUser) throw new NotFoundException('Platform User not found in database.');

    // Flatten permissions: rolePermissions -> permission -> name
    const userPermissions = platformUser.user.platformUserRoles.flatMap(userRole => 
      userRole.role.rolePermissions.map(rp => rp.permission.name)
    );

    if (!userPermissions.includes(requiredPermission)) {
      throw new ForbiddenException(`You do not have the required permission: ${requiredPermission}`);
    }

    // Attach the actual User UUID for auditing (createdBy/updatedBy fields)
    request.user.dbId = platformUser.userId;
    return true;
  }
}