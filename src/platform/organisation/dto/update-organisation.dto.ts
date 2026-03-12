import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, IsBoolean, IsIn } from 'class-validator';

export class UpdateOrganisationDto {
  @ApiProperty({ example: 'Updated Law Firm Name' })
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'contact@updateddomain.com' })
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'ACTIVE' })
    @IsString()
    @IsNotEmpty()
    @IsIn(['INVITED', 'ACTIVE', 'DISABLED'])
    status: 'INVITED' | 'ACTIVE' | 'DISABLED';
}