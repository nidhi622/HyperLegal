import { IsUUID } from 'class-validator';

export class GetOrganisationUserParamsDto {
  @IsUUID()
  organisationId: string;

  @IsUUID()
  userId: string;
}