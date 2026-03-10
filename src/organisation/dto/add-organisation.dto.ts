import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma/enums';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum OrganisationRole {
  STANDARD = 'Standard User',
  ADMIN = 'Company Admin',
}

export class CreateOrganisationDto {
  @ApiProperty({ 
    example: 'ABC Law Firm', 
    description: 'The formal name of the organisation' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required.' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    example: 'contact@abclaw.com', 
    description: 'Primary contact email for the organisation' 
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @MaxLength(255)
  email: string;
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
