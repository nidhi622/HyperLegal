import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CognitoModule } from './cognito/cognito.module';
import { DatabaseModule } from './database';
import { OrganisationModule } from './platform/organisation/organisation.module';
import { UsersModule } from './platform/users/users.module';
import { DynamoDBModule } from './dynamoDB/dynamoDB.module';
import { AwsModule } from './aws/aws.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CognitoModule,
    AuthModule,
    UsersModule,
    OrganisationModule,
    DynamoDBModule,
    AwsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
