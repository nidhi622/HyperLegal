import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
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
import { createHmac } from 'crypto';
import { PrismaService } from 'src/database/prisma.service';
import { ApiResponse } from 'src/utils/api-response';
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
    const response = new ApiResponse('User registered successfully');
    const normalizedEmail = dto.email.toLowerCase();

    try {
      const existingUser = await this.prisma.platformUsers.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        response.statusCode = HttpStatus.CONFLICT;
        response.message = 'This email is already registered.';
        return response;
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

      // 2. Prisma MySQL Entry
      const newUser = await this.prisma.platformUsers.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: normalizedEmail,
          role: dto.role,
          // cognitoSub: cognitoRes.UserSub ,
        },
      });

      // 3. Format Standardized Response
      response.data = newUser;
      return response;
    } catch (error: any) {
      // 4. Handle Standardized Error
      console.log('err:', error);
      response.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      response.message = 'Registration failed';
      response.error = error.message;
      return response;
    }
  }

  //login fucntion
  async login(email: string, pass: string,role:string) {
    
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      //   UserPoolId: this.config.get('COGNITO_USER_POOL_ID')!,
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
      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
        ExpiresIn:response.AuthenticationResult?.ExpiresIn,
        TokenType: response.AuthenticationResult?.TokenType,
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
}
