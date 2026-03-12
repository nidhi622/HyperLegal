import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/database';

@Injectable()
export class AuthPrecheckGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { email } = request.body;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        platformUser: true,
        // organisationUsers: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPlatformActive =
      user.platformUser && user.platformUser.status === 1;

    // const isOrganisationActive = user.organisationUsers.some(
    //   (u) => u.statusId === 2,
    // );

    if (!isPlatformActive) {
      throw new UnauthorizedException('User account inactive');
    }

    request.user = user;

    return true;
  }
}
