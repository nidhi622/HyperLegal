import { IsEmail, IsNotEmpty, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateOrganisationUserDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsUUID()
  organisationId: string;
}