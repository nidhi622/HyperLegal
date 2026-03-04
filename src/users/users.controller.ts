import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permissions } from 'src/auth/permissions.decorator';
import { CreatePlatformUserDto, UpdatePlatformUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('platform_users.create')
  create(@Body() payload: CreatePlatformUserDto) {
    return this.usersService.create(payload);
  }

  @Get()
  @Permissions('platform_users.read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Permissions('platform_users.read')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('platform_users.update')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: UpdatePlatformUserDto,
  ) {
    return this.usersService.update(id, payload);
  }

  @Delete(':id')
  @Permissions('platform_users.delete')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.remove(id);
  }
}
