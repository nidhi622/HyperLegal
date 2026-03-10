import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformAdminGuard } from 'src/common/guards/platform-admin.guard';
import { PermissionsGuard } from 'src/common/guards/platform-admin.permission.guard';

import { OrganisationService } from './organisation.service';
import { FindAllOrganisationsDto } from './dto/find-all-organisation.dto';
import { successResponse } from 'src/utils/api-response';
import { CreateOrganisationDto, CreateOrganisationUserDto, UpdateOrganisationUserDto } from './dto/add-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';

@Controller('platform/admin/organisations')
@ApiTags('Organisation')
@ApiBearerAuth()
@UseGuards(PlatformAdminGuard)
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  // @Post()
  // @Permissions('organisation.create')
  // create(@Body() payload: CreateOrganisationDto, @Req() req: any) {
  //   return this.organisationService.createOrganisation(
  //     payload,
  //     req.user,
  //     req.headers['x-session-id'] ?? req.headers['session-id'],
  //   );
  // }

  @Get()
  findAll() {
    return this.organisationService.getAllOrganisations();
  }

  @ApiOperation({ summary: 'Retrieve a paginated list of organisations' })
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
  @Put(':id')
  @SetMetadata('permission', 'organisation.update')
  async update(
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
  @Get(':id')
  @SetMetadata('permission', 'organisation.view.details')
  async getDetails(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.organisationService.findOne(id);
    return successResponse(
      'Organisation details retrieved successfully.',
      data,
    );
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.organisationService.deleteOrganisation(id);
  }

  @Post(':organisationId/users')
  addUser(
    @Param('organisationId', new ParseUUIDPipe()) organisationId: string,
    @Body() payload: CreateOrganisationUserDto,
  ) {
    return this.organisationService.addOrganisationUser(
      organisationId,
      payload,
    );
  }

  @Get(':organisationId/users')
  getUsers(
    @Param('organisationId', new ParseUUIDPipe()) organisationId: string,
  ) {
    return this.organisationService.getOrganisationUsers(organisationId);
  }

  @Get(':organisationId/users/:id')
  getUserById(
    @Param('organisationId', new ParseUUIDPipe()) organisationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.organisationService.getOrganisationUserById(organisationId, id);
  }

  @Patch(':organisationId/users/:id')
  updateUser(
    @Param('organisationId', new ParseUUIDPipe()) organisationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: UpdateOrganisationUserDto,
  ) {
    return this.organisationService.updateOrganisationUser(
      organisationId,
      id,
      payload,
    );
  }

  @Delete(':organisationId/users/:id')
  deleteUser(
    @Param('organisationId', new ParseUUIDPipe()) organisationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.organisationService.deleteOrganisationUser(organisationId, id);
  }
}
