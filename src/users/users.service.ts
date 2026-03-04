import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { API_ERROR_CODES } from 'src/common/constants/error-codes';
import { CognitoService } from 'src/cognito/cognito.service';
import { PrismaService } from 'src/database/prisma.service';
import {
  ApiResponse,
  errorResponse,
  successResponse,
} from 'src/utils/api-response';
import { CreatePlatformUserDto, UpdatePlatformUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cognitoService: CognitoService,
  ) {}

  async create(payload: CreatePlatformUserDto): Promise<ApiResponse> {
    const email = payload.email.toLowerCase();

    const existingUser = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `;

    if (existingUser.length > 0) {
      return errorResponse(API_ERROR_CODES.CONFLICT, 'Platform user email already exists.');
    }

    const cognitoResult = await this.cognitoService.createUser({
      email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      sendInvite: payload.sendInvite,
    });

    const appUserId = randomUUID();
    const platformUserId = randomUUID();

    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        INSERT INTO users (id, first_name, last_name, email, created_at, updated_at)
        VALUES (${appUserId}, ${payload.firstName}, ${payload.lastName ?? null}, ${email}, NOW(), NOW())
      `,
      this.prisma.$executeRaw`
        INSERT INTO platform_users (id, user_id, cognito_sub, status, created_at, updated_at)
        VALUES (
          ${platformUserId},
          ${appUserId},
          ${cognitoResult.userSub},
          ${payload.status ?? true},
          NOW(),
          NOW()
        )
      `,
    ]);

    await this.assignRoleToPlatformUser(platformUserId, payload.role);
    const user = await this.getPlatformUserById(platformUserId);

    return successResponse('Platform user created successfully.', user);
  }

  async findAll(): Promise<ApiResponse> {
    const users = await this.prisma.$queryRaw<PlatformUserView[]>`
      SELECT
        pu.id AS "id",
        pu.user_id AS "userId",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.email AS "email",
        pu.cognito_sub AS "cognitoSub",
        pu.status AS "status",
        pu.created_at AS "createdAt",
        pu.updated_at AS "updatedAt",
        COALESCE(
          ARRAY_AGG(DISTINCT pr.name) FILTER (WHERE pr.name IS NOT NULL),
          ARRAY[]::TEXT[]
        ) AS roles
      FROM platform_users pu
      JOIN users u ON u.id = pu.user_id
      LEFT JOIN platform_user_roles pur ON pur.user_id = pu.id
      LEFT JOIN platform_roles pr ON pr.id = pur.platform_role_id
      GROUP BY pu.id, pu.user_id, u.first_name, u.last_name, u.email, pu.cognito_sub, pu.status, pu.created_at, pu.updated_at
      ORDER BY pu.created_at DESC
    `;

    return successResponse('Platform users retrieved successfully.', users);
  }

  async findOne(id: string): Promise<ApiResponse> {
    const user = await this.getPlatformUserById(id);

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Platform user not found.');
    }

    return successResponse('Platform user retrieved successfully.', user);
  }

  async update(id: string, payload: UpdatePlatformUserDto): Promise<ApiResponse> {
    const user = await this.getPlatformUserById(id);

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Platform user not found.');
    }

    if (payload.email) {
      const email = payload.email.toLowerCase();
      const existingUser = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT u.id
        FROM users u
        WHERE u.email = ${email} AND u.id <> ${user.userId}
        LIMIT 1
      `;

      if (existingUser.length > 0) {
        return errorResponse(API_ERROR_CODES.CONFLICT, 'Platform user email already exists.');
      }

      payload.email = email;
    }

    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        UPDATE users
        SET
          first_name = COALESCE(${payload.firstName ?? null}, first_name),
          last_name = COALESCE(${payload.lastName ?? null}, last_name),
          email = COALESCE(${payload.email ?? null}, email),
          updated_at = NOW()
        WHERE id = ${user.userId}
      `,
      this.prisma.$executeRaw`
        UPDATE platform_users
        SET
          status = COALESCE(${payload.status ?? null}, status),
          updated_at = NOW()
        WHERE id = ${id}
      `,
    ]);

    if (payload.role) {
      await this.assignRoleToPlatformUser(id, payload.role);
    }
    const updatedUser = await this.getPlatformUserById(id);

    return successResponse('Platform user updated successfully.', updatedUser);
  }

  async remove(id: string): Promise<ApiResponse> {
    const user = await this.getPlatformUserById(id);

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Platform user not found.');
    }

    await this.prisma.$transaction([
      this.prisma.$executeRaw`DELETE FROM platform_user_roles WHERE user_id = ${id}`,
      this.prisma.$executeRaw`DELETE FROM platform_users WHERE id = ${id}`,
    ]);

    try {
      await this.cognitoService.deleteUser(user.email);
    } catch {
      // Keep DB as source-of-truth in case Cognito account is absent.
    }

    return successResponse('Platform user deleted successfully.', {});
  }

  private async assignRoleToPlatformUser(platformUserId: string, roleName: string): Promise<void> {
    const roles = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM platform_roles
      WHERE name = ${roleName}
      LIMIT 1
    `;
    const roleId = roles[0]?.id;
    if (!roleId) {
      return;
    }

    await this.prisma.$executeRaw`
      DELETE FROM platform_user_roles
      WHERE user_id = ${platformUserId}
    `;

    await this.prisma.$executeRaw`
      INSERT INTO platform_user_roles (id, user_id, platform_role_id, created_at, updated_at)
      VALUES (${randomUUID()}, ${platformUserId}, ${roleId}, NOW(), NOW())
    `;
  }

  private async getPlatformUserById(id: string): Promise<PlatformUserView | null> {
    const rows = await this.prisma.$queryRaw<PlatformUserView[]>`
      SELECT
        pu.id AS "id",
        pu.user_id AS "userId",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.email AS "email",
        pu.cognito_sub AS "cognitoSub",
        pu.status AS "status",
        pu.created_at AS "createdAt",
        pu.updated_at AS "updatedAt",
        COALESCE(
          ARRAY_AGG(DISTINCT pr.name) FILTER (WHERE pr.name IS NOT NULL),
          ARRAY[]::TEXT[]
        ) AS roles
      FROM platform_users pu
      JOIN users u ON u.id = pu.user_id
      LEFT JOIN platform_user_roles pur ON pur.user_id = pu.id
      LEFT JOIN platform_roles pr ON pr.id = pur.platform_role_id
      WHERE pu.id = ${id}
      GROUP BY pu.id, pu.user_id, u.first_name, u.last_name, u.email, pu.cognito_sub, pu.status, pu.created_at, pu.updated_at
      LIMIT 1
    `;

    return rows[0] ?? null;
  }
}

type PlatformUserView = {
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
