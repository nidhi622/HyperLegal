import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

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