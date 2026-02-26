import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

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