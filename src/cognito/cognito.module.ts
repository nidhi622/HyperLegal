import { Module } from '@nestjs/common';
import { CognitoController } from './cognito.controller';

@Module({
  controllers: [CognitoController]
})
export class CognitoModule {}
