import { Module } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CognitoModule } from 'src/cognito/cognito.module';
import { DatabaseModule } from 'src/database';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';

@Module({
  imports: [DatabaseModule, CognitoModule],
  controllers: [OrganisationController],
  providers: [OrganisationService, JwtAuthGuard],
})
export class OrganisationModule {}
