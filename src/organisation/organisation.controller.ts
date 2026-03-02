import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OrganisationService } from './organisation.service';
import {
  CreateOrganisationDto,
  CreateOrganisationUserDto,
  UpdateOrganisationDto,
  UpdateOrganisationUserDto,
} from './dto/add-organisation.dto';

@Controller('organisation')
@ApiTags('Organisation')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Post()
  create(@Body() payload: CreateOrganisationDto) {
    return this.organisationService.createOrganisation(payload);
  }

  @Get()
  findAll() {
    return this.organisationService.getAllOrganisations();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.organisationService.getOrganisationById(id);
  }


  // change it with PUT
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: UpdateOrganisationDto,
  ) {
    return this.organisationService.updateOrganisation(id, payload);
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
    return this.organisationService.addOrganisationUser(organisationId, payload);
  }

  @Get(':organisationId/users')
  getUsers(@Param('organisationId', new ParseUUIDPipe()) organisationId: string) {
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
    return this.organisationService.updateOrganisationUser(organisationId, id, payload);
  }

  @Delete(':organisationId/users/:id')
  deleteUser(
    @Param('organisationId', new ParseUUIDPipe()) organisationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.organisationService.deleteOrganisationUser(organisationId, id);
  }
}
