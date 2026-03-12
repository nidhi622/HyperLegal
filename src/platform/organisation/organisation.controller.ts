import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  SetMetadata,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformAdminGuard } from 'src/common/guards/platform-admin.guard';
import { PermissionsGuard } from 'src/common/guards/platform-admin.permission.guard';

import { successResponse } from 'src/utils/api-response';
import {
  CreateOrganisationDto,
} from './dto/add-organisation.dto';
import { CreateOrganisationUserDto } from './dto/create-organisation-user.dto';
import { FindAllOrganisationsDto } from './dto/find-all-organisation.dto';
import { GetOrganisationUserParamsDto } from './dto/get-organisation-user.dto';
import { ListOrganisationUsersDto } from './dto/list-organisation-users.dto';
import { UpdateOrganisationUserDto } from './dto/update-organisation-user.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationService } from './organisation.service';

@Controller('platform/admin/organisation')
@ApiTags('Organisation')
@ApiBearerAuth()
@UseGuards(PlatformAdminGuard, PermissionsGuard)
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @ApiOperation({ summary: 'Retrieve a paginated list of organisations' })
  @ApiBearerAuth('access-token')
  @Post('list')
  @SetMetadata('permission', 'organisation.view.list')
  async listOrganisations(@Body() queryDto: FindAllOrganisationsDto) {
    const result = await this.organisationService.findAll(queryDto);
    return successResponse(
      'Organisations retrieved successfully.',
      result.data,
      result.meta,
    );
  }

  @ApiOperation({ summary: 'Create a new organisation' })
  @ApiBearerAuth('access-token')
  @Post()
  @SetMetadata('permission', 'organisation.create')
  async createOrganisation(
    @Body() createDto: CreateOrganisationDto,
    @Req() req: any,
  ) {
    const data = await this.organisationService.create(
      createDto,
      req.user.dbId,
    );
    return successResponse('Organisation added successfully.', data);
  }

  @ApiOperation({ summary: 'Update organisation details' })
  @ApiBearerAuth('access-token')
  @Put(':id')
  @SetMetadata('permission', 'organisation.update')
  async updateOrganisation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateOrganisationDto,
    @Req() req: any,
  ) {
    const data = await this.organisationService.update(
      id,
      updateDto,
      req.user.dbId,
    );
    return successResponse('Organisation updated successfully.', data);
  }

  @ApiOperation({ summary: 'Get organisation details' })
  @ApiBearerAuth('access-token')
  @Get(':id')
  @SetMetadata('permission', 'organisation.view.details')
  async getOrganisationDetails(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.organisationService.findOne(id);
    return successResponse(
      'Organisation details retrieved successfully.',
      data,
    );
  }

  @Get('/:organisationId/users/:userId')
  @SetMetadata('permission', 'organisation.user.view.details')
  async getOrganisationUser(@Param() params: GetOrganisationUserParamsDto) {
    const data = await this.organisationService.getOrganisationUser(params);

    return successResponse(
      'Organisation user details fetched successfully.',
      data,
    );
  }

  @ApiOperation({ summary: 'Get organisation users (paginated)' })
  @ApiBearerAuth('access-token')
  @Get('/:organisationId/users')
  @SetMetadata('permission', 'organisation.user.view.list')
  async listOrganisationUsers(
    @Param('organisationId', ParseUUIDPipe) organisationId: string,
    @Query() query: ListOrganisationUsersDto,
  ) {
    const result = await this.organisationService.listOrganisationUsers(
      organisationId,
      query,
    );

    return successResponse(
      'Organisation users retrieved successfully.',
      result.data,
      result.meta,
    );
  }

  @ApiOperation({ summary: 'Create a new organisation user' })
  @ApiBearerAuth('access-token')
  @Post('/users')
  @SetMetadata('permission', 'organisation.user.create')
  async createOrganisationUser(
    @Body() dto: CreateOrganisationUserDto,
    @Req() req: any,
  ) {
    await this.organisationService.createOrganisationUser(dto, req.user.dbId);

    return successResponse('Organisation user created successfully.', {});
  }

  @ApiOperation({ summary: 'Update organisation user details' })
  @ApiBearerAuth('access-token')
  @Put('/:organisationId/users/:userId')
  @SetMetadata('permission', 'organisation.user.update')
  async updateOrganisationUser(
    @Param() params: GetOrganisationUserParamsDto,
    @Body() dto: UpdateOrganisationUserDto,
    @Req() req: any,
  ) {
    await this.organisationService.updateOrganisationUser(
      params,
      dto,
      req.user.dbId,
    );

    return successResponse('Organisation user updated successfully.', {});
  }
}
