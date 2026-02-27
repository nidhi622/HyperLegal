import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { UserRole } from 'generated/prisma/client';

export class CreateOrganisationData {
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
}

export class UpdateOrganizationData extends PartialType(CreateOrganisationData) {}

export class AddOrganizationUserData {
  @ApiProperty({ example: 'uuid-of-organization' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'Harvey' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Specter' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'harvey@specterlit.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.standard })
  @IsEnum(UserRole)
  role: UserRole;
}