import { Module } from '@nestjs/common';
import { CognitoModule } from 'src/cognito/cognito.module';
import { DatabaseModule } from 'src/database';
import { OrganisationController } from './organisation.controller';
import { OrganisationUserController } from './organisation-user.controller';
import { OrganisationService } from './organisation.service';
import { SesService } from 'src/aws/ses.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';
import { OrganisationPermissionsGuard } from 'src/common/guards/organisation.permission.guard';
import { OrganisationUserGuard } from 'src/common/guards/organisation-user.guard';

@Module({
  imports: [DatabaseModule, CognitoModule,AuthModule],
  controllers: [OrganisationController, OrganisationUserController],
  providers: [
    OrganisationService,
    SesService,
    AuthService,
    OrganisationUserGuard,
    OrganisationPermissionsGuard,
  ],
})
export class OrganisationModule {}
