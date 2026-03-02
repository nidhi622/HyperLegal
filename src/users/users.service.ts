import { Injectable } from '@nestjs/common';
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

    const existingUser = await this.prisma.platformUsers.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(API_ERROR_CODES.CONFLICT, 'Platform user email already exists.');
    }

    const cognitoResult = await this.cognitoService.createUser({
      email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      sendInvite: payload.sendInvite,
    });

    const user = await this.prisma.platformUsers.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email,
        role: payload.role,
        status: payload.status ?? true,
        cognitoSub: cognitoResult.userSub,
      },
    });

    return successResponse('Platform user created successfully.', user);
  }

  async findAll(): Promise<ApiResponse> {
    const users = await this.prisma.platformUsers.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return successResponse('Platform users retrieved successfully.', users);
  }

  async findOne(id: string): Promise<ApiResponse> {
    const user = await this.prisma.platformUsers.findUnique({ where: { id } });

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Platform user not found.');
    }

    return successResponse('Platform user retrieved successfully.', user);
  }

  async update(id: string, payload: UpdatePlatformUserDto): Promise<ApiResponse> {
    const user = await this.prisma.platformUsers.findUnique({ where: { id } });

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Platform user not found.');
    }

    if (payload.email) {
      const email = payload.email.toLowerCase();
      const existingUser = await this.prisma.platformUsers.findUnique({ where: { email } });

      if (existingUser && existingUser.id !== id) {
        return errorResponse(API_ERROR_CODES.CONFLICT, 'Platform user email already exists.');
      }

      payload.email = email;
    }

    const updatedUser = await this.prisma.platformUsers.update({
      where: { id },
      data: payload,
    });

    return successResponse('Platform user updated successfully.', updatedUser);
  }

  async remove(id: string): Promise<ApiResponse> {
    const user = await this.prisma.platformUsers.findUnique({ where: { id } });

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Platform user not found.');
    }

    await this.prisma.platformUsers.delete({ where: { id } });

    try {
      await this.cognitoService.deleteUser(user.email);
    } catch {
      // Keep DB as source-of-truth in case Cognito account is absent.
    }

    return successResponse('Platform user deleted successfully.', {});
  }
}
