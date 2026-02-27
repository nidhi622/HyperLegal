// auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AddUserDto } from './dto/add-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfirmNewPasswordDto } from './dto/confirm-new-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('add-user')
  @ApiOperation({ summary: 'Invite a new user to a law firm' })
  async addUser(@Body() request: AddUserDto) {
    return this.authService.addUser(request);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user and return access token' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
 async login(@Body() request: LoginDto) {
    return this.authService.login(request.email, request.password,request.role);
  }

  @Post('forgot-password')
  async forgot(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  @Post('confirm-new-password')
  async confirmNew(@Body() dto: ConfirmNewPasswordDto) {
    return this.authService.confirmNewPassword(dto.email, dto.newPassword, dto.session);
  }

 
}
