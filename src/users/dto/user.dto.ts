import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma/enums';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePlatformUserDto {
  @ApiProperty({ example: 'Mike' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Ross', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'mike.ross@hyperlegal.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.admin })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  sendInvite?: boolean;
}

export class UpdatePlatformUserDto extends PartialType(CreatePlatformUserDto) {}
