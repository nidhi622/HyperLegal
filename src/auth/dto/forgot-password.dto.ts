import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {

  @ApiProperty({
    example: 'dev@hyperlegal.dev',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;
}