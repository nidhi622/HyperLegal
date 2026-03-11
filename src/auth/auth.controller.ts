// auth/auth.controller.ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AddUserDto } from './dto/add-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfirmNewPasswordDto } from './dto/confirm-new-user.dto';
import { AuthPrecheckGuard } from 'src/common/guards/auth-precheck-active-user-guard';

@Controller(['auth', 'platform/auth/login'])
export class AuthController {
  constructor(private authService: AuthService) {}

  

  @Post('login')
  @UseGuards(AuthPrecheckGuard)
  @ApiOperation({ summary: 'Login a user and return access token' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() request: LoginDto) {
    return this.authService.login(request.email, request.password);
  }

  @ApiOperation({ summary: 'Forgot Password' })
  @Post('forgot-password')
  async forgot(@Body() dto: ForgotPasswordDto) {
    console.log("api called with req:: ", dto)
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.new_password);
  }

  @Post('confirm-new-password')
  async confirmNew(@Body() dto: ConfirmNewPasswordDto) {
    return this.authService.confirmNewPassword(dto.email, dto.newPassword, dto.session);
  }

 
}
