import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';

// Defined roles based on documentation
export enum UserRole {
  STANDARD = 'Standard User',
  ADMIN = 'Company Admin',
}

export class LoginDto {
  @ApiProperty({
    example: 'dev@hyperlegal.dev',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssword123', description: 'The user password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AddUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'jdoe@lawfirm.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STANDARD })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: true })
  @IsBoolean()
  sendInvite: boolean;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class ConfirmNewPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  session: string; // The "Temporary Hall Pass" from Cognito

  @IsString()
  @MinLength(8)
  newPassword: string;
}
