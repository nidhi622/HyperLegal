import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SesService {
  private client: SESClient;

  constructor(private config: ConfigService,) {
    const accessKeyId =
      this.config.get<string>('AWS_IAM_USER_ACCESS_KEY_ID') ??
      this.config.getOrThrow<string>('AWS_IAM_USER_ACCESS_ID');
    const secretAccessKey =
      this.config.get<string>('AWS_IAM_USER_SECRET_ACCESS_KEY') ??
      this.config.getOrThrow<string>('AWS_IAM_USER_SECRET_KEY');
    const region = this.config.getOrThrow<string>('AWS_REGION');
    const endpoint = this.config.get<string>('SES_ENDPOINT');

    this.client = new SESClient({
      region,
      ...(endpoint ? { endpoint } : {}),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }


  async sendResetPasswordEmail(email: string, resetLink: string) {

    console.log("email::", email)
    email="nidhi@weassemble.team"
    const command = new SendEmailCommand({
      Source: 'nidhi@weassemble.team',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Reset Password',
        },
        Body: {
          Text: {
            Data: `Click here to reset password: ${resetLink}`,
          },
        },
      },
    });

    return this.client.send(command);
  }
}
