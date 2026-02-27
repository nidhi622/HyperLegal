import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database';
import { UsersModule } from './users/users.module';
import { FirmsModule } from './firms/firms.module';
import { OrganisationModule } from './organisation/organisation.module';
import { CognitoService } from './cognito/cognito.service';
import { CognitoModule } from './cognito/cognito.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),AuthModule,DatabaseModule, CognitoModule, 
    UsersModule, FirmsModule, OrganisationModule
  ],
  controllers: [AppController],
  providers: [AppService, CognitoService],
})
export class AppModule {}
