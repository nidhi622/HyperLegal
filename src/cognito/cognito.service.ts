import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
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
    this.client = new CognitoIdentityProviderClient({
      region: this.config.get<string>('AWS_REGION'),
    });
  }

  async createUser(payload: CognitoCreateUserPayload): Promise<{ userSub: string | null }> {
    const email = payload.email.toLowerCase();
    const userPoolId = this.config.get<string>('COGNITO_USER_POOL_ID');

    if (userPoolId) {
      const result = await this.client.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: email,
          TemporaryPassword: this.config.get<string>('COGNITO_TEMP_PASSWORD') ?? 'TempPassword#123',
          DesiredDeliveryMediums: payload.sendInvite === false ? [] : ['EMAIL'],
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'given_name', Value: payload.firstName },
            { Name: 'family_name', Value: payload.lastName ?? '' },
            { Name: 'custom:role', Value: payload.role },
          ],
        }),
      );

      const userSub = result.User?.Attributes?.find((attribute) => attribute.Name === 'sub')?.Value ?? null;
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
        Password: this.config.get<string>('COGNITO_TEMP_PASSWORD') ?? 'TempPassword#123',
        SecretHash: this.calculateSecretHash(email),
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: `${payload.firstName} ${payload.lastName ?? ''}`.trim() },
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

  private calculateSecretHash(username: string): string | undefined {
    const clientId = this.config.get<string>('COGNITO_CLIENT_ID');
    const clientSecret = this.config.get<string>('COGNITO_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return undefined;
    }

    return createHmac('sha256', clientSecret)
      .update(username + clientId)
      .digest('base64');
  }
}
