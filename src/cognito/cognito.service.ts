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
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import { GetOrganisationUserParamsDto } from './dto/get-organisation-user-params.dto';
// import { UserRole } from 'generated/prisma/enums';

export type CognitoCreateUserPayload = {
  email: string;
  firstName: string;
  lastName?: string | null;
  password: string;
  // role: UserRole;
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
      UserPoolId: this.config.get<string>('PLATFORM_USER_POOL_ID'),
      ClientId: this.config.get<string>('PLATFORM_APP_CLIENT_ID'),
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.calculateSecretHash(email),
      },
    });
    return this.client.send(command);
  }

  async loginOrganisationUser(email: string, password: string) {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: this.config.get<string>('ORGANISATION_USER_POOL_ID'),
      ClientId: this.config.get<string>('ORGANISATION_APP_CLIENT_ID'),
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.calculateOrganisationSecretHash(email),
      },
    });
    return this.client.send(command);
  }

  // async login1(email: string, pass: string) {
  //   const command = new InitiateAuthCommand({
  //     AuthFlow: 'USER_PASSWORD_AUTH',
  //     // UserPoolId: this.config.get('COGNITO_USER_POOL_ID')!,
  //     ClientId: this.config.get('COGNITO_CLIENT_ID')!,
  //     AuthParameters: {
  //       USERNAME: email,
  //       PASSWORD: pass,
  //       SECRET_HASH: this.calculateSecretHash(email),

  //       // If your App Client has a secret, you must add SECRET_HASH here
  //     },
  //   });

  //   try {
  //     console.log('command::: ', command);
  //     const response = await this.client.send(command);

  //     console.log('response: ', response);
  //     console.log(
  //       'response.AuthenticationResult: ',
  //       response.AuthenticationResult,
  //     );

  //     return response;
  //   } catch (error) {
  //     console.log('error; ', error);
  //     throw new UnauthorizedException('Authentication Failed');
  //   }
  // }

  async forgotPassword(email: string) {
    console.log('email: ', email);
    const command = new ForgotPasswordCommand({
      ClientId: this.config.get<string>('PLATFORM_APP_CLIENT_ID'),
      Username: email,
    });

    return this.client.send(command);
  }

  async confirmPassword(email: string, code: string, newPassword: string) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.config.get<string>('PLATFORM_APP_CLIENT_ID'),
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    return this.client.send(command);
  }

  async createOrganisationUser(
    payload: CognitoCreateUserPayload,
  ): Promise<{ userSub: string | null }> {
    const email = payload.email.toLowerCase();
    const userPoolId = this.config.get<string>('ORGANISATION_USER_POOL_ID');
    console.log('userPolId in creation: ', userPoolId);
    if (userPoolId) {
      const result = await this.client.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: email,
          TemporaryPassword: payload.password,
          DesiredDeliveryMediums: payload.sendInvite === false ? [] : ['EMAIL'],
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'given_name', Value: payload.firstName },
            { Name: 'family_name', Value: payload.lastName ?? '' },
          ],
        }),
      );

      console.log("res:: in creation  ", JSON.stringify(result));
      const userSub =
        result.User?.Attributes?.find((attribute) => attribute.Name === 'sub')
          ?.Value ?? null;
      return { userSub };
    } else {
      return { userSub: null };
    }

    // const clientId = this.config.get<string>('PLATFORM_APP_CLIENT_ID');
    // if (!clientId) {
    //   return { userSub: null };
    // }

    // const result = await this.client.send(
    //   new SignUpCommand({
    //     ClientId: clientId,
    //     Username: email,
    //     Password: this.generateTempPassword() ?? 'TempPassword#123',
    //     SecretHash: this.calculateSecretHash(email),
    //     UserAttributes: [
    //       { Name: 'email', Value: email },
    //       {
    //         Name: 'name',
    //         Value: `${payload.firstName} ${payload.lastName ?? ''}`.trim(),
    //       },
    //       // { Name: 'custom:role', Value: payload.role },
    //     ],
    //   }),
    // );

    // return { userSub: result.UserSub ?? null };
  }

  async createPlatformUser(
    payload: CognitoCreateUserPayload,
  ): Promise<{ userSub: string | null }> {
    const email = payload.email.toLowerCase();
    const userPoolId = this.config.get<string>('PLATFORM_USER_POOL_ID');
    console.log('userPolId in creation: ', userPoolId);
    if (userPoolId) {

      console.log("in if condition")
      const result = await this.client.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: email,
          TemporaryPassword: payload.password,
          DesiredDeliveryMediums: payload.sendInvite === false ? [] : ['EMAIL'],
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'given_name', Value: payload.firstName },
            { Name: 'family_name', Value: payload.lastName ?? '' },
          ],
        }),
      );

      console.log("res:: in creation  ", result);
      const userSub =
        result.User?.Attributes?.find((attribute) => attribute.Name === 'sub')
          ?.Value ?? null;
      return { userSub };
    } else {

      console.log("in else ")
      return { userSub: null };
    }

    // const clientId = this.config.get<string>('PLATFORM_APP_CLIENT_ID');
    // if (!clientId) {
    //   return { userSub: null };
    // }

    // const result = await this.client.send(
    //   new SignUpCommand({
    //     ClientId: clientId,
    //     Username: email,
    //     Password: this.generateTempPassword() ?? 'TempPassword#123',
    //     SecretHash: this.calculateSecretHash(email),
    //     UserAttributes: [
    //       { Name: 'email', Value: email },
    //       {
    //         Name: 'name',
    //         Value: `${payload.firstName} ${payload.lastName ?? ''}`.trim(),
    //       },
    //       // { Name: 'custom:role', Value: payload.role },
    //     ],
    //   }),
    // );

    // return { userSub: result.UserSub ?? null };
  }

  async getOrganisationUser(
    params: GetOrganisationUserParamsDto,
  ): Promise<any> {
    const userPoolId = this.config.get<string>('ORGANISATION_USER_POOL_ID');
    console.log('userPollId in get :: ', userPoolId);
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: params.email,
    });
    const res = await this.client.send(command);

    console.log('ress:: ', res);
  }

  async deleteUser(email: string): Promise<void> {
    const userPoolId = this.config.get<string>('PLATFORM_USER_POOL_ID');
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
    const userPoolId = this.config.get<string>('PLATFORM_USER_POOL_ID');

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

  async setOrganisationUserPassword(
    email: string,
    newPassword: string,
  ): Promise<void> {
    const userPoolId = this.config.get<string>('ORGANISATION_USER_POOL_ID');

    if (!userPoolId) {
      throw new Error('ORGANISATION_USER_POOL_ID is not configured');
    }

    await this.client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email.toLowerCase(),
        Password: newPassword,
        Permanent: true,
      }),
    );
  }

  private calculateSecretHash(username: string): string {
    const clientId = this.config.get('PLATFORM_APP_CLIENT_ID')!;
    const clientSecret = this.config.get('PLATFORM_APP_CLIENT_SECRET')!;
    return createHmac('sha256', clientSecret)
      .update(username + clientId)
      .digest('base64');
  }

  private calculateOrganisationSecretHash(username: string): string {
    const clientId = this.config.get('ORGANISATION_APP_CLIENT_ID')!;
    const clientSecret = this.config.get('ORGANISATION_APP_CLIENT_SECRET')!;
    return createHmac('sha256', clientSecret)
      .update(username + clientId)
      .digest('base64');
  }

  private generateTempPassword(length: number = 12): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*_-+=';

    const all = upper + lower + numbers + special;

    const getRandom = (str: string) =>
      str[Math.floor(Math.random() * str.length)];

    let password =
      getRandom(upper) +
      getRandom(lower) +
      getRandom(numbers) +
      getRandom(special);

    for (let i = password.length; i < length; i++) {
      password += getRandom(all);
    }

    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }
}
