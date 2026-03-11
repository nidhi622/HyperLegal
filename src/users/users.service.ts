import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
// import { UserRole } from 'generated/prisma/enums';
import { API_ERROR_CODES } from 'src/common/constants/error-codes';
import { CognitoService } from 'src/cognito/cognito.service';
import { PrismaService } from 'src/database/prisma.service';
import {
  ApiResponse,
  errorResponse,
  successResponse,
} from 'src/utils/api-response';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cognitoService: CognitoService,
  ) {}

  async create(payload: CreateUserDto): Promise<ApiResponse> {
    const email = payload.email.toLowerCase();
    const roleToAssign = payload.role;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return errorResponse(
        API_ERROR_CODES.CONFLICT,
        'User email already exists.',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName ?? null,
        email,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const cognitoResult = await this.cognitoService.createUser({
      email,
      firstName: payload.firstName,
      lastName: payload.lastName ?? null,
      // role: roleToAssign,
      sendInvite: payload.sendInvite,
    });

    if (!cognitoResult.userSub) {
      await this.prisma.user.delete({ where: { id: user.id } });
      return errorResponse(
        API_ERROR_CODES.INTERNAL,
        'User creation failed.',
      );
    }

    return successResponse('User created successfully.', {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      cognitoSub: cognitoResult.userSub,
    });
  }

  async findAll(): Promise<ApiResponse> {
    const platformUsers = await this.prisma.platformUser.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedUsers = await Promise.all(
      platformUsers.map(async (pu) => {
        const userRoles = await this.prisma.platformUserRole.findMany({
          where: {
            userId: pu.userId,
          },
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        });

        return {
          id: pu.id,
          userId: pu.userId,
          firstName: pu.user.firstName,
          lastName: pu.user.lastName,
          email: pu.user.email,
          cognitoSub: pu.cognitoSub,
          // status: pu.status,
          createdAt: pu.createdAt,
          updatedAt: pu.updatedAt,
          roles: userRoles.map((ur) => ur.role.name),
        };
      }),
    );

    return successResponse('Users retrieved successfully.', formattedUsers);
  }

  async findOne(id: string): Promise<ApiResponse> {
    const user = await this.getUserById(id);

    if (!user) {
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'User not found.',
      );
    }

    return successResponse('User retrieved successfully.', user);
  }

  async update(id: string, payload: UpdateUserDto): Promise<ApiResponse> {
    const user = await this.getUserById(id);

    if (!user) {
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'User not found.',
      );
    }

    if (payload.email) {
      const email = payload.email.toLowerCase();
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email,
          id: { not: user.userId },
        },
        select: { id: true },
      });

      if (existingUser) {
        return errorResponse(
          API_ERROR_CODES.CONFLICT,
          'User email already exists.',
        );
      }

      payload.email = email;
    }

    // Update user
    await this.prisma.user.update({
      where: { id: user.userId },
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
      },
    });

    // Update platform user status if provided
    // if (payload.status !== undefined) {
    //   await this.prisma.platformUser.update({
    //     where: { id },
    //     data: {
    //       status: payload.status,
    //     },
    //   });
    // }

    if (payload.role) {
      await this.assignRoleToUser(id, payload.role);
    }
    const updatedUser = await this.getUserById(id);

    return successResponse('User updated successfully.', updatedUser);
  }

  async remove(id: string): Promise<ApiResponse> {
    const user = await this.getUserById(id);

    if (!user) {
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'User not found.',
      );
    }

    // Delete platform user roles first
    await this.prisma.platformUserRole.deleteMany({
      where: { userId: id },
    });

    // Delete platform user
    await this.prisma.platformUser.delete({
      where: { id },
    });

    try {
      await this.cognitoService.deleteUser(user.email);
    } catch {
      // Keep DB as source-of-truth in case Cognito account is absent.
    }

    return successResponse('User deleted successfully.', {});
  }

  private async assignRoleToUser(platformUserId: string, roleName: string): Promise<void> {
    const role = await this.prisma.platformRole.findUnique({
      where: { name: roleName },
      select: { id: true },
    });

    const roleId = role?.id;
    if (!roleId) {
      return;
    }

    // Delete existing roles
    await this.prisma.platformUserRole.deleteMany({
      where: { userId: platformUserId },
    });

    // Create new role
    // await this.prisma.platformUserRole.create({
    //   data: {
    //     id: randomUUID(),
    //     userId: platformUserId,
    //     roleId: roleId,
    //   },
    // });
  }

  private async getUserById(id: string): Promise<UserView | null> {
    const platformUser = await this.prisma.platformUser.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!platformUser) {
      return null;
    }

    const userRoles = await this.prisma.platformUserRole.findMany({
      where: {
        userId: platformUser.userId,
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: platformUser.id,
      userId: platformUser.userId,
      firstName: platformUser.user.firstName,
      lastName: platformUser.user.lastName,
      email: platformUser.user.email,
      cognitoSub: platformUser.cognitoSub,
      status: true,
      createdAt: platformUser.createdAt,
      updatedAt: platformUser.updatedAt,
      roles: userRoles.map((ur) => ur.role.name),
    };
  }

  async findUserByEmail(email: string): Promise<ApiResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    return successResponse('User found.', user);
  }
}

type UserView = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  cognitoSub: string | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: string[];
};
