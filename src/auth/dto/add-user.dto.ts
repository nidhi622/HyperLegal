import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { UserRole } from "generated/prisma/enums";
// import { UserRole } from "prisma/client/client";
// import { UserRole } from "prisma/client/enums";
// import { UserRole } from "generated/prisma/enums";


// export enum UserRole {
//   STANDARD = 'standard',
//   ADMIN = 'admin',
// }

// enum UserRole {
//   standard,
//   admin
// }


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

  @ApiProperty({ enum: UserRole, example: UserRole.standard })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: true })
  @IsBoolean()
  sendInvite: boolean;
}