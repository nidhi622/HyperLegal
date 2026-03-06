import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { API_ERROR_CODES } from 'src/common/constants/error-codes';
import {
  CognitoIdentityProviderClient,
  // AdminInitiateAuthCommand,
  // AdminCreateUserCommand,
  ConfirmForgotPasswordCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AdminDeleteUserCommand,
  // AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, randomBytes } from 'crypto';
import { PrismaService } from 'src/database/prisma.service';
import {
  ApiResponse,
  errorResponse,
  successResponse,
} from 'src/utils/api-response';
import { AddUserDto } from './dto/add-user.dto';
import { CognitoService } from 'src/cognito/cognito.service';
import { PasswordResetRepository } from './repositories/password-reset.repository';

@Injectable()
export class AuthService {
  private client: CognitoIdentityProviderClient;
  // private prisma:PrismaService

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private readonly cognitoService: CognitoService,
    private readonly dynamoRempo: PasswordResetRepository,
  ) {
    this.client = new CognitoIdentityProviderClient();
    //   {
    //   region: this.config.get('AWS_REGION'),
    // }
  }

  // JOURNEY 1: Admin registers a new law-firm
  //   add user
  // async addUser(dto: AddUserDto) {
  //   const command = new SignUpCommand({
  //     // UserPoolId: this.config.get('COGNITO_USER_POOL_ID')!,
  //     ClientId: this.config.get('COGNITO_CLIENT_ID')!,
  //     Username: dto.email,
  //     Password: 'F08q62Td2rHWKo96#',
  //     SecretHash: this.calculateSecretHash(dto.email),
  //     UserAttributes: [
  //       { Name: 'name', Value: `${dto.firstName} ${dto.lastName}` },
  //       { Name: 'email', Value: dto.email },
  //     ],
  //     // Only sends email if "Send Invite" was checked in your UI
  //     // DesiredDeliveryMediums: dto.sendInvite ? ['EMAIL'] : [],
  //   });

  //   const res= await this.client.send(command);
  //   return res;
  // }

  async addUser(dto: AddUserDto): Promise<ApiResponse> {
    const normalizedEmail = dto.email.toLowerCase();

    try {
      const existingUser = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1
      `;

      if (existingUser.length > 0) {
        return errorResponse(
          API_ERROR_CODES.CONFLICT,
          'This email is already registered.',
        );
      }
      // 1. Cognito SignUp
      // const cognitoCommand = new SignUpCommand({
      //   ClientId: this.config.get('COGNITO_CLIENT_ID')!,
      //   Username: normalizedEmail,
      //   Password: 'F08q62Td2rHWKo96#',
      //   SecretHash: this.calculateSecretHash(normalizedEmail),
      //   UserAttributes: [
      //     { Name: 'name', Value: `${dto.firstName} ${dto.lastName}` },
      //     { Name: 'email', Value: normalizedEmail },
      //   ],
      // });
      // console.log("cognitCOmmand: ", cognitoCommand)

      // const cognitoRes = await this.client.send(cognitoCommand);

      const appUserId = randomUUID();
      const platformUserId = randomUUID();

      await this.prisma.$transaction([
        this.prisma.$executeRaw`
          INSERT INTO users (id, first_name, last_name, email, created_at, updated_at)
          VALUES (${appUserId}, ${dto.firstName}, ${dto.lastName ?? null}, ${normalizedEmail}, NOW(), NOW())
        `,
        this.prisma.$executeRaw`
          INSERT INTO platform_users (id, user_id, status, created_at, updated_at)
          VALUES (${platformUserId}, ${appUserId}, true, NOW(), NOW())
        `,
      ]);

      await this.assignRoleToPlatformUser(platformUserId, dto.role);
      const newUser = await this.prisma.$queryRaw<
        {
          id: string;
          userId: string;
          firstName: string;
          lastName: string | null;
          email: string;
        }[]
      >`
        SELECT
          pu.id AS "id",
          pu.user_id AS "userId",
          u.first_name AS "firstName",
          u.last_name AS "lastName",
          u.email AS "email"
        FROM platform_users pu
        JOIN users u ON u.id = pu.user_id
        WHERE pu.id = ${platformUserId}
        LIMIT 1
      `;

      // 3. Format Standardized Response
      return successResponse(
        'User registered successfully.',
        newUser[0] ?? null,
      );
    } catch (error: any) {
      // 4. Handle Standardized Error
      console.log('err:', error);
      return errorResponse(API_ERROR_CODES.INTERNAL, 'Registration failed.', [
        { message: error?.message ?? 'Unknown error' },
      ]);
    }
  }

  //login fucntion
  async login1(email: string, pass: string) {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      // UserPoolId: this.config.get('COGNITO_USER_POOL_ID')!,
      ClientId: this.config.get('COGNITO_CLIENT_ID')!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: pass,
        SECRET_HASH: this.calculateSecretHash(email),

        // If your App Client has a secret, you must add SECRET_HASH here
      },
    });

    try {
      console.log('command::: ', command);
      const response = await this.client.send(command);

      console.log('response: ', response);
      console.log(
        'response.AuthenticationResult: ',
        response.AuthenticationResult,
      );
      // const actorRows = await this.prisma.$queryRaw<{ platformUserId: string }[]>`
      //   SELECT pu.id AS "platformUserId"
      //   FROM platform_users pu
      //   JOIN users u ON u.id = pu.user_id
      //   WHERE u.email = ${email.toLowerCase()} AND pu.status = true
      //   LIMIT 1
      // `;
      // const platformUserId = actorRows[0]?.platformUserId;
      // const permissionRows = platformUserId
      //   ? await this.prisma.$queryRaw<{ name: string }[]>`
      //       SELECT DISTINCT p.name
      //       FROM platform_user_roles pur
      //       JOIN platform_role_permissions prp
      //         ON prp.platform_role_id = pur.platform_role_id
      //       JOIN platform_permissions p
      //         ON p.id = prp.platform_permission_id
      //       WHERE pur.user_id = ${platformUserId}
      //     `
      //   : [];
      // const permissions = permissionRows.map((row) => row.name);

      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
        ExpiresIn: response.AuthenticationResult?.ExpiresIn,
        TokenType: response.AuthenticationResult?.TokenType,
        // permissions,
      };
      // return response.AuthenticationResult;
    } catch (error) {
      console.log('error; ', error);
      throw new UnauthorizedException('Authentication Failed');
    }
  }

  async login(email: string, password: string) {
    try {
      console.log('email: ', email, 'password', password);
      const cognitoResponse = await this.cognitoService.login(email, password);

      const authResult = cognitoResponse.AuthenticationResult;

      if (!authResult) {
        throw new UnauthorizedException();
      }

      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          platformUserRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException();
      }

      // Extract roles
      const roles = user.platformUserRoles.map((r) => r.role.name);

      // Extract permissions
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
    } catch (error) {
      console.log('errr: ', error);
      return errorResponse(
        API_ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }
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

  // JOURNEY 3: Forgot Password
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    console.log('user::', user);

    if (user) {
      const token = randomBytes(32).toString('hex');

      try {
        // Save to DynamoDB via Repository
        await this.dynamoRempo.saveToken(user.id, token, 3600);
      } catch (error) {
        console.error('Failed to save password reset token to DynamoDB:', error);
        throw new InternalServerErrorException(
          'Password reset is temporarily unavailable. Please try again.',
        );
      }

      // Send Email via SES...
      console.log(`Sending SES email to ${email} with token ${token}`);
      // await this.sesService.sendResetEmail(email, token);
    }

    return {
      success: true,
      message: "If the email is registered in our system, a password reset link has been sent.",
    };
  }
  //   reset pawd
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
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

  // async forgotPassword(email: string) {
  //   const command = new ForgotPasswordCommand({
  //     ClientId: this.config.get('COGNITO_CLIENT_ID')!,
  //     Username: email,
  //     SecretHash: this.calculateSecretHash(email),
  //   });

  //   try {
  //     return await this.client.send(command);
  //   } catch (error) {
  //     console.error('Forgot Password Error:', error);
  //     throw new BadRequestException('Could not initiate password reset');
  //   }
  // }

  // JOURNEY 2: RESET PASSWORD (Confirm with Code from Email)
  // async resetPassword(email: string, code: string, newPassword: string) {
  //   const command = new ConfirmForgotPasswordCommand({
  //     ClientId: this.config.get('COGNITO_CLIENT_ID')!,
  //     Username: email,
  //     ConfirmationCode: code,
  //     Password: newPassword,
  //     SecretHash: this.calculateSecretHash(email),
  //   });

  //   try {
  //     return await this.client.send(command);
  //   } catch (error) {
  //     console.error('Reset Password Error:', error);
  //     throw new BadRequestException('Invalid code or password does not meet requirements');
  //   }
  // }

  // JOURNEY 3: CONFIRM NEW PASSWORD (For newly added users)
  // When you use addUser, they are in FORCE_CHANGE_PASSWORD state
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

  // async editUser(email: string, updates: Partial<AddUserDto>) {
  //   const attributes: AttributeType[] = [];
  //   if (updates.firstName) attributes.push({ Name: 'given_name', Value: updates.firstName });
  //   if (updates.lastName) attributes.push({ Name: 'family_name', Value: updates.lastName });
  //   if (updates.role) attributes.push({ Name: 'custom:role', Value: updates.role });

  //   const command = new AdminUpdateUserAttributesCommand({
  //     UserPoolId: this.config.get('COGNITO_USER_POOL_ID')!,
  //     Username: email,
  //     UserAttributes: attributes,
  //   });
  //   return await this.client.send(command);
  // }

  // JOURNEY 5: Delete User (Admin Action)
  async deleteUser(email: string) {
    const command = new AdminDeleteUserCommand({
      UserPoolId: this.config.get('COGNITO_USER_POOL_ID')!,
      Username: email,
    });
    return await this.client.send(command);
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

  private async assignRoleToPlatformUser(
    platformUserId: string,
    roleName: string,
  ): Promise<void> {
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
}
