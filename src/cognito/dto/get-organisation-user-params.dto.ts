import { IsEmail } from "class-validator";

export class GetOrganisationUserParamsDto{
    @IsEmail()
    email: string
} 
