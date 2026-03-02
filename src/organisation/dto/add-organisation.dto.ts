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

export class CreateOrganisationDto {
  @ApiProperty({ example: 'Pearson Hardman' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'admin@pearsonhardman.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'pearsonhardman.com', required: false })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({ required: false, example: { policy: 'default' } })
  @IsOptional()
  redFlagPolicies?: Record<string, unknown>;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateOrganisationDto extends PartialType(CreateOrganisationDto) {}

export class CreateOrganisationUserDto {
  @ApiProperty({ example: 'Harvey' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Specter' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'harvey@specterlitt.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.standard })
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

export class UpdateOrganisationUserDto extends PartialType(CreateOrganisationUserDto) {}
