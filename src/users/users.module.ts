import { Module } from '@nestjs/common';
import { CognitoModule } from 'src/cognito/cognito.module';
import { DatabaseModule } from 'src/database';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule, CognitoModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
