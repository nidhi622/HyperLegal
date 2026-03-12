import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateOrganisationUserDto {

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'jdoe@lawfirm.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678-1234-1234-1234-123456789012' })
  @IsUUID()
  organisationId: string;
}