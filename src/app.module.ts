import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CognitoModule } from './cognito/cognito.module';
import { DatabaseModule } from './database';
import { OrganisationModule } from './organisation/organisation.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CognitoModule,
    AuthModule,
    UsersModule,
    OrganisationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
