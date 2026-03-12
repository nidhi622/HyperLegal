import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CognitoService } from 'src/cognito/cognito.service';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { API_ERROR_CODES } from 'src/common/constants/error-codes';
import { successResponse } from 'src/utils/api-response';
import { UserStatus } from 'src/constant';

@Injectable()
export class OrganisationAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cognitoService: CognitoService,
    private readonly tokenRepo: PasswordResetRepository,
  ) {}

  async setPassword(token: string, password: string) {
    const passwordErrors = this.validatePasswordPolicy(password);
    if (passwordErrors.length > 0) {
      throw new BadRequestException({
        code: API_ERROR_CODES.VALIDATION,
        message: 'Validation failed. Please check the input fields.',
        details: passwordErrors.map((message) => ({
          field: 'password',
          message,
        })),
      });
    }

    const tokenRecord = await this.tokenRepo.findByToken(token);
    if (!tokenRecord) {
      throw new BadRequestException({
        code: API_ERROR_CODES.INVALID_TOKEN,
        message: 'The token is invalid or has expired.',
        details: [],
      });
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (!tokenRecord.expires_at || tokenRecord.expires_at <= nowInSeconds) {
      throw new BadRequestException({
        code: API_ERROR_CODES.INVALID_TOKEN,
        message: 'The token is invalid or has expired.',
        details: [],
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: tokenRecord.user_id },
      select: { id: true, email: true },
    });

    if (!user?.email) {
      throw new BadRequestException({
        code: API_ERROR_CODES.INVALID_TOKEN,
        message: 'The token is invalid or has expired.',
        details: [],
      });
    }

    const orgUserRole = await this.prisma.organisationUserRole.findFirst({
      where: { userId: user.id },
      include: { organisation: true },
    });

    if (!orgUserRole) {
      throw new BadRequestException({
        code: API_ERROR_CODES.NOT_FOUND,
        message: 'Organisation user not found.',
        details: [],
      });
    }

    try {
      await this.cognitoService.setOrganisationUserPassword(
        user.email,
        password,
      );
    } catch (error: any) {
      if (error?.name === 'InvalidPasswordException') {
        throw new BadRequestException({
          code: API_ERROR_CODES.VALIDATION,
          message: 'Validation failed. Please check the input fields.',
          details: [{ field: 'password', message: error?.message }],
        });
      }

      throw new InternalServerErrorException(
        'Password update is temporarily unavailable. Please try again.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.organisationUser.update({
        where: { userId: user.id },
        data: { status: UserStatus.ACTIVE },
      });

      await tx.organisationAuditLog.create({
        data: {
          organisationId: orgUserRole.organisationId,
          userId: user.id,
          action: 'User Activated',
          details: `USER ID: ${user.id}`,
        },
      });
    });

    await this.tokenRepo.deleteToken(token);

    return successResponse('Password has been set successfully.', {});
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        organisationUsers: true,
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
    });

    if (!user || !user.organisationUsers) {
      throw new UnauthorizedException({
        code: API_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    if (user.organisationUsers.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: API_ERROR_CODES.USER_INACTIVE,
        message: 'User account is inactive',
      });
    }

    const cognitoResponse = await this.cognitoService.loginOrganisationUser(
      normalizedEmail,
      password,
    );

    const authResult = cognitoResponse.AuthenticationResult;

    if (!authResult) {
      throw new UnauthorizedException({
        code: API_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    const roles = user.organisationUserRoles.map((r) => r.role.name);
    const permissions = user.organisationUserRoles.flatMap((r) =>
      r.role.rolePermissions.map((rp) => rp.permission.name),
    );

    const primaryOrg = user.organisationUserRoles[0]?.organisation ?? null;

    await this.prisma.organisationUser.update({
      where: { userId: user.id },
      data: { lastLoginAt: new Date() },
    });

    return successResponse('Login successful.', {
      accessToken: authResult.AccessToken,
      refreshToken: authResult.RefreshToken,
      tokenType: authResult.TokenType,
      expiresIn: authResult.ExpiresIn,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organisation: primaryOrg
          ? { id: primaryOrg.id, name: primaryOrg.name }
          : null,
        roles: Array.from(new Set(roles)),
        permissions: Array.from(new Set(permissions)),
        lastLoginAt: new Date(),
      },
    });
  }

  private validatePasswordPolicy(password: string): string[] {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least 1 uppercase character.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least 1 lowercase character.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least 1 number.');
    }
    if (!/[\^$*.\[\]{}()?\-"!@#%&/\\,><':;|_~`+=]/.test(password)) {
      errors.push(
        'Password must contain at least 1 special character from the allowed set.',
      );
    }

    return errors;
  }
}
