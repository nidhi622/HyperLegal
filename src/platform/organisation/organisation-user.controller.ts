import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganisationUserGuard } from 'src/common/guards/organisation-user.guard';
import { OrganisationPermissionsGuard } from 'src/common/guards/organisation.permission.guard';
import { successResponse } from 'src/utils/api-response';
import { OrganisationService } from './organisation.service';
import { CreateOrganisationUserByOrgDto } from './dto/create-organisation-user-by-org.dto';

@ApiTags('Organisation Users')
@Controller('organisation')
@ApiBearerAuth()
@UseGuards(OrganisationUserGuard, OrganisationPermissionsGuard)
export class OrganisationUserController {
  constructor(private readonly organisationService: OrganisationService) {}

  @ApiOperation({ summary: 'Create a new organisation user (org portal)' })
  @Post(':organisationId/users')
  @SetMetadata('permission', 'organisation.user.create')
  async createOrganisationUser(
    @Param('organisationId', ParseUUIDPipe) organisationId: string,
    @Body() dto: CreateOrganisationUserByOrgDto,
    @Req() req: any,
  ) {
    await this.organisationService.createOrganisationUserByOrganisation(
      organisationId,
      dto,
      req.user.dbId,
    );

    return successResponse(
      'Organisation user created successfully. An invitation email has been sent to the user.',
      {},
    );
  }
}
