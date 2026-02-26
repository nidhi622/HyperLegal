import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),AuthModule,DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
