import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import { SesService } from 'src/aws/ses.service';
import { CognitoService } from 'src/cognito/cognito.service';
import { API_ERROR_CODES } from 'src/common/constants/error-codes';
import { PrismaService } from 'src/database/prisma.service';
import {
  ApiResponse,
  errorResponse,
  successResponse,
} from 'src/utils/api-response';
import { PasswordResetRepository } from './repositories/password-reset.repository';

@Injectable()
export class AuthService {
  private client: CognitoIdentityProviderClient;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private readonly cognitoService: CognitoService,
    private readonly dynamoRempo: PasswordResetRepository,
    private readonly sesService: SesService,
  ) {
    this.client = new CognitoIdentityProviderClient();
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        platformUserRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: API_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    const cognitoResponse = await this.cognitoService.login(email, password);

    const authResult = cognitoResponse.AuthenticationResult;

    if (!authResult) {
      throw new UnauthorizedException({
        code: API_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    const roles = user.platformUserRoles.map((r) => r.role.name);

    const permissions = user.platformUserRoles.flatMap((r) =>
      r.role.rolePermissions.map((rp) => rp.permission.name),
    );

    return successResponse('Login successful.', {
      access_token: authResult.AccessToken,
      refresh_token: authResult.RefreshToken,
      token_type: authResult.TokenType,
      expires_in: authResult.ExpiresIn,
      user: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        roles,
        permissions,
        last_login_at: new Date(),
      },
    });
  }

  async adminLogin(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const adminUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        platformUsers: {
          where: { status: true },
          select: { id: true },
          take: 1,
        },
        platformUserRoles: {
          where: { role: { name: 'admin' } },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (
      !adminUser ||
      adminUser.platformUsers.length === 0 ||
      adminUser.platformUserRoles.length === 0
    ) {
      throw new UnauthorizedException('Unauthorized access.');
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.config.get('COGNITO_CLIENT_ID')!,
      AuthParameters: {
        USERNAME: normalizedEmail,
        PASSWORD: password,
        SECRET_HASH: this.calculateSecretHash(normalizedEmail),
      },
    });

    try {
      const response = await this.client.send(command);
      const authResult = response.AuthenticationResult;

      if (!authResult?.AccessToken) {
        throw new UnauthorizedException('Invalid email or password.');
      }

      await this.prisma.platformUser.update({
        where: { id: adminUser.platformUsers[0].id },
        data: { lastLoginAt: new Date(), updatedAt: new Date() },
      });

      return successResponse('Admin login successful.', {
        accessToken: authResult.AccessToken,
        refreshToken: authResult.RefreshToken,
        idToken: authResult.IdToken,
        expiresIn: authResult.ExpiresIn,
        tokenType: authResult.TokenType,
      });
    } catch (error: any) {
      if (
        error instanceof UnauthorizedException ||
        ['NotAuthorizedException', 'UserNotFoundException'].includes(
          error?.name,
        )
      ) {
        throw new UnauthorizedException('Invalid email or password.');
      }

      throw new InternalServerErrorException('Admin login failed.');
    }
  }

  async forgotPasswordd(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'User not found.');
    }
    console.log('user::', user);

    if (user) {
      const token = randomBytes(32).toString('hex');

      try {
        // Save to DynamoDB via Repository
        await this.dynamoRempo.saveToken(user.id, token, 3600);
      } catch (error) {
        console.error(
          'Failed to save password reset token to DynamoDB:',
          error,
        );
        throw new InternalServerErrorException(
          'Password reset is temporarily unavailable. Please try again.',
        );
      }

      // Send Email via SES...
      console.log(`Sending SES email to ${email} with token ${token}`);
      // await this.sesService.sendResetEmail(email, token);

      // const resetLink = `http://localhost:3000/reset-password?token=${token}`;

      const resetLink = `${this.config.get('BACKEND_URL')}/reset-password?token=${token}`;

      console.log('resetLink::', resetLink);
      const res = await this.sesService.sendResetPasswordEmail(
        email,
        resetLink,
      );

      console.log('res BY SES: ', res);
    }

    return {
      success: true,
      message:
        'If the email is registered in our system, a password reset link has been sent.',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse(
        API_ERROR_CODES.VALIDATION,
        'Validation failed. Please check the input fields.',
        [
          {
            field: 'email',
            message: 'Email must be a valid email address.',
          },
        ],
      );
    }

    const token = randomBytes(32).toString('hex');

    await this.dynamoRempo.saveToken(user.id, token, 3600);

   const resetLink = `${this.config.get('BACKEND_URL')}/reset-password?token=${token}`;
   console.log('resetLink::', resetLink);

    const res = await this.sesService.sendResetPasswordEmail(email, resetLink);

    console.log('SES response:::', res);

    return successResponse(
      'If the email is registered in our system, a password reset link has been sent.',
      {},
    );
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ApiResponse> {
    const passwordValidationErrors = this.validatePasswordPolicy(newPassword);
    if (passwordValidationErrors.length > 0) {
      throw new BadRequestException({
        code: API_ERROR_CODES.VALIDATION,
        message: 'Validation failed. Please check the input fields.',
        details: passwordValidationErrors.map((message) => ({
          field: 'new_password',
          message,
        })),
      });
    }

    const tokenRecord = await this.dynamoRempo.findByToken(token);
    if (!tokenRecord) {
      throw new BadRequestException({
        code: API_ERROR_CODES.INVALID_TOKEN,
        message: 'The token is invalid.',
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
      select: { email: true },
    });

    if (!user?.email) {
      throw new BadRequestException({
        code: API_ERROR_CODES.INVALID_TOKEN,
        message: 'The token is invalid or has expired.',
        details: [],
      });
    }

    try {
      await this.cognitoService.setUserPassword(user.email, newPassword);
    } catch (error: any) {
      if (error?.name === 'InvalidPasswordException') {
        throw new BadRequestException({
          code: API_ERROR_CODES.VALIDATION,
          message: 'Validation failed. Please check the input fields.',
          details: [{ field: 'new_password', message: error?.message }],
        });
      }

      console.error('Cognito reset password failed:', error);
      throw new InternalServerErrorException(
        'Password reset is temporarily unavailable. Please try again.',
      );
    }

    await this.dynamoRempo.deleteToken(token);

    return successResponse(
      'Password has been reset successfully.',
      {},
      {
        timestamp: new Date().toISOString(),
        request_id: `req_${Date.now()}`,
      },
    );
  }

  async confirmNewPassword(email: string, newPass: string, session: string) {
    const command = new RespondToAuthChallengeCommand({
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      ClientId: this.config.get('COGNITO_CLIENT_ID')!,
      Session: session,
      ChallengeResponses: {
        USERNAME: email,
        NEW_PASSWORD: newPass,
        SECRET_HASH: this.calculateSecretHash(email),
      },
    });

    try {
      const response = await this.client.send(command);
      return response.AuthenticationResult;
    } catch (error) {
      throw new UnauthorizedException('Could not set new password');
    }
  }

  private calculateSecretHash(username: string): string {
    const clientId = this.config.get('COGNITO_CLIENT_ID')!;
    const clientSecret = this.config.get('COGNITO_CLIENT_SECRET')!;

    return createHmac('sha256', clientSecret)
      .update(username + clientId)
      .digest('base64');
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
