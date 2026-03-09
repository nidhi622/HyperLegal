import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminSetUserPasswordCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminInitiateAuthCommand,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import { UserRole } from 'generated/prisma/enums';

export type CognitoCreateUserPayload = {
  email: string;
  firstName: string;
  lastName?: string | null;
  role: UserRole;
  sendInvite?: boolean;
};

@Injectable()
export class CognitoService {
  private readonly client: CognitoIdentityProviderClient;

  constructor(private readonly config: ConfigService) {
    const accessKeyId =
      this.config.get<string>('AWS_IAM_USER_ACCESS_KEY_ID') ??
      this.config.get<string>('AWS_IAM_USER_ACCESS_ID');
    const secretAccessKey =
      this.config.get<string>('AWS_IAM_USER_SECRET_ACCESS_KEY') ??
      this.config.get<string>('AWS_IAM_USER_SECRET_KEY');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing IAM credentials. Set AWS_IAM_USER_ACCESS_KEY_ID and AWS_IAM_USER_SECRET_ACCESS_KEY in env.',
      );
    }

    this.client = new CognitoIdentityProviderClient({
      region: this.config.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async login(email: string, password: string) {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: this.config.get<string>('COGNITO_USER_POOL_ID'),
      ClientId: this.config.get<string>('COGNITO_CLIENT_ID'),
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.calculateSecretHash(email),
      },
    });
    return this.client.send(command);
  }

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

      return response;
    } catch (error) {
      console.log('error; ', error);
      throw new UnauthorizedException('Authentication Failed');
    }
  }

  async forgotPassword(email: string) {
    console.log('email: ', email);
    const command = new ForgotPasswordCommand({
      ClientId: this.config.get<string>('COGNITO_CLIENT_ID'),
      Username: email,
    });

    return this.client.send(command);
  }

  async confirmPassword(email: string, code: string, newPassword: string) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.config.get<string>('COGNITO_CLIENT_ID'),
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    return this.client.send(command);
  }

  async createUser(
    payload: CognitoCreateUserPayload,
  ): Promise<{ userSub: string | null }> {
    const email = payload.email.toLowerCase();
    const userPoolId = this.config.get<string>('COGNITO_USER_POOL_ID');

    if (userPoolId) {
      const result = await this.client.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: email,
          TemporaryPassword:
            this.config.get<string>('COGNITO_TEMP_PASSWORD') ??
            'TempPassword#123',
          DesiredDeliveryMediums: payload.sendInvite === false ? [] : ['EMAIL'],
          UserAttributes: [
            { Name: 'email', Value: email },
            // { Name: 'email_verified', Value: 'true' },
            { Name: 'given_name', Value: payload.firstName },
            { Name: 'family_name', Value: payload.lastName ?? '' },
            { Name: 'custom:role', Value: payload.role },
          ],
        }),
      );

      const userSub =
        result.User?.Attributes?.find((attribute) => attribute.Name === 'sub')
          ?.Value ?? null;
      return { userSub };
    }

    const clientId = this.config.get<string>('COGNITO_CLIENT_ID');
    if (!clientId) {
      return { userSub: null };
    }

    const result = await this.client.send(
      new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password:
          this.config.get<string>('COGNITO_TEMP_PASSWORD') ??
          'TempPassword#123',
        SecretHash: this.calculateSecretHash(email),
        UserAttributes: [
          { Name: 'email', Value: email },
          {
            Name: 'name',
            Value: `${payload.firstName} ${payload.lastName ?? ''}`.trim(),
          },
          { Name: 'custom:role', Value: payload.role },
        ],
      }),
    );

    return { userSub: result.UserSub ?? null };
  }

  async deleteUser(email: string): Promise<void> {
    const userPoolId = this.config.get<string>('COGNITO_USER_POOL_ID');
    if (!userPoolId) {
      return;
    }

    await this.client.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: email.toLowerCase(),
      }),
    );
  }

  async setUserPassword(email: string, newPassword: string): Promise<void> {
    const userPoolId = this.config.get<string>('COGNITO_USER_POOL_ID');

    console.log('userPoolId::', userPoolId);
    if (!userPoolId) {
      throw new Error('COGNITO_USER_POOL_ID is not configured');
    }

    try {
      await this.client.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: email.toLowerCase(),
          Password: newPassword,
          Permanent: true,
        }),
      );
    } catch (err) {
      console.log('err in settign pwdd::', err);
      throw err;
    }
  }

  private calculateSecretHash(username: string): string {
    const clientId = this.config.get('COGNITO_CLIENT_ID')!;
    const clientSecret = this.config.get('COGNITO_CLIENT_SECRET')!;
    console.log('clientSecret: ', clientSecret);
    return createHmac('sha256', clientSecret)
      .update(username + clientId)
      .digest('base64');
  }
}
