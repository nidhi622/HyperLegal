import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { UserRole } from 'generated/prisma/client';

export class CreatePlatformUserRequest {
  @ApiProperty({ example: 'Mike' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Ross' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'mike.ross@hyperlegal.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.admin })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdatePlatformUserRequest extends PartialType(CreatePlatformUserRequest) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class ConfirmUserRequest {
  @ApiProperty({ example: 'mike.ross@hyperlegal.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}