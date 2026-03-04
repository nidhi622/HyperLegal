import { Injectable, UnauthorizedException } from '@nestjs/common';
import { API_ERROR_CODES } from 'src/common/constants/error-codes';
import {
  CognitoIdentityProviderClient,
  // AdminInitiateAuthCommand,
  // AdminCreateUserCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  AdminDeleteUserCommand,
  // AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import { PrismaService } from 'src/database/prisma.service';
import { ApiResponse, errorResponse, successResponse } from 'src/utils/api-response';
import { AddUserDto } from './dto/add-user.dto';

@Injectable()
export class AuthService {
  private client: CognitoIdentityProviderClient;
  // private prisma:PrismaService

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
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
        return errorResponse(API_ERROR_CODES.CONFLICT, 'This email is already registered.');
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
      const newUser = await this.prisma.$queryRaw<{
        id: string;
        userId: string;
        firstName: string;
        lastName: string | null;
        email: string;
      }[]>`
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
      return successResponse('User registered successfully.', newUser[0] ?? null);
    } catch (error: any) {
      // 4. Handle Standardized Error
      console.log('err:', error);
      return errorResponse(API_ERROR_CODES.INTERNAL, 'Registration failed.', [
        { message: error?.message ?? 'Unknown error' },
      ]);
    }
  }

  //login fucntion
  async login(email: string, pass: string) {
    
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
        ExpiresIn:response.AuthenticationResult?.ExpiresIn,
        TokenType: response.AuthenticationResult?.TokenType,
        // permissions,
      };
      // return response.AuthenticationResult;
    } catch (error) {
      console.log('error; ', error);
      throw new UnauthorizedException('Authentication Failed');
    }
  }

  // JOURNEY 3: Forgot Password
  async forgotPassword(email: string) {
    const command = new ForgotPasswordCommand({
      ClientId: this.config.get('COGNITO_CLIENT_ID')!,
      Username: email,
    });

    const res = await this.client.send(command);
    console.log('res: ', res);
    return res;
  }
  //   reset pawd
  async resetPassword(email: string, code: string, newPassword: string) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.config.get('COGNITO_CLIENT_ID')!,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });
    return await this.client.send(command);
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
