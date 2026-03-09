// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/database';
import { AdminAuthController } from './admin-auth.controller';
import { CognitoService } from 'src/cognito/cognito.service';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { DynamoDBModule } from 'src/dynamoDB/dynamoDB.module';
import { SesService } from 'src/aws/ses.service';

@Module({
  // imports: [DatabaseModule],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, PrismaService,CognitoService,PasswordResetRepository,SesService],
})
export class AuthModule {}
