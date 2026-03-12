import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OrganisationSetPasswordDto {
  @ApiProperty({
    example: 'a8f3c2b1d9e74f8ab1234567890abcdef',
    description: 'Invitation token received in email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'P@ssword123', description: 'The user password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
