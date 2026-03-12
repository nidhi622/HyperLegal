import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { OrganisationSetPasswordDto } from './dto/organisation-set-password.dto';
import { OrganisationAuthService } from './organisation-auth.service';

@ApiTags('Organisation Auth')
@Controller('organisation/auth')
export class OrganisationAuthController {
  constructor(private readonly organisationAuthService: OrganisationAuthService) {}

  @Post('set-password')
  @ApiOperation({ summary: 'Set password for organisation user' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  async setPassword(@Body() dto: OrganisationSetPasswordDto) {
    return this.organisationAuthService.setPassword(dto.token, dto.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login organisation user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() dto: LoginDto) {
    return this.organisationAuthService.login(dto.email, dto.password);
  }
}
