// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PlatformAdminAuthController } from './platform-admin-auth.controller';
import { PrismaService } from 'src/database';
import { AdminAuthController } from './admin-auth.controller';
import { CognitoService } from 'src/cognito/cognito.service';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { DynamoDBModule } from 'src/dynamoDB/dynamoDB.module';
import { SesService } from 'src/aws/ses.service';
import { OrganisationAuthController } from './organisation-auth.controller';
import { OrganisationAuthService } from './organisation-auth.service';

@Module({
  // imports: [DatabaseModule],
  controllers: [
    PlatformAdminAuthController,
    AdminAuthController,
    OrganisationAuthController,
  ],
  providers: [
    AuthService,
    OrganisationAuthService,
    PrismaService,
    CognitoService,
    PasswordResetRepository,
    SesService,
  ],
  exports: [AuthService, OrganisationAuthService, PasswordResetRepository],
})
export class AuthModule {}
