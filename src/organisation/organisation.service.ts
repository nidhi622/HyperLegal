import { Injectable } from '@nestjs/common';
import { API_ERROR_CODES } from 'src/common/constants/error-codes';
import { CognitoService } from 'src/cognito/cognito.service';
import { PrismaService } from 'src/database/prisma.service';
import {
  ApiResponse,
  errorResponse,
  successResponse,
} from 'src/utils/api-response';
import {
  CreateOrganisationDto,
  CreateOrganisationUserDto,
  UpdateOrganisationDto,
  UpdateOrganisationUserDto,
} from './dto/add-organisation.dto';

@Injectable()
export class OrganisationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cognitoService: CognitoService,
  ) {}

  async createOrganisation(payload: CreateOrganisationDto): Promise<ApiResponse> {
    const email = payload.email.toLowerCase();

    const existing = await this.prisma.organisation.findUnique({
      where: { email },
    });

    if (existing) {
      return errorResponse(API_ERROR_CODES.CONFLICT, 'Organization email already exists.');
    }

    const organisation = await this.prisma.organisation.create({
      data: {
        name: payload.name,
        email,
        domain: payload.domain,
        redFlagPolicies: payload.redFlagPolicies as any,
        status: payload.status ?? true,
      },
    });

    return successResponse('Organization created successfully.', organisation);
  }

  async getAllOrganisations(): Promise<ApiResponse> {
    const organisations = await this.prisma.organisation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return successResponse('Organizations retrieved successfully.', organisations);
  }

  async getOrganisationById(id: string): Promise<ApiResponse> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
    });

    if (!organisation) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Organization not found.');
    }

    return successResponse('Organization retrieved successfully.', organisation);
  }

  async updateOrganisation(id: string, payload: UpdateOrganisationDto): Promise<ApiResponse> {
    const organisation = await this.prisma.organisation.findUnique({ where: { id } });

    if (!organisation) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Organization not found.');
    }

    if (payload.email) {
      const email = payload.email.toLowerCase();
      const existing = await this.prisma.organisation.findUnique({ where: { email } });

      if (existing && existing.id !== id) {
        return errorResponse(API_ERROR_CODES.CONFLICT, 'Organization email already exists.');
      }

      payload.email = email;
    }

    const updatedOrganisation = await this.prisma.organisation.update({
      where: { id },
      data: {
        ...payload,
        redFlagPolicies: payload.redFlagPolicies as any,
      },
    });

    return successResponse('Organization updated successfully.', updatedOrganisation);
  }

  async deleteOrganisation(id: string): Promise<ApiResponse> {
    const organisation = await this.prisma.organisation.findUnique({ where: { id } });

    if (!organisation) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Organization not found.');
    }

    await this.prisma.organisation.delete({ where: { id } });

    return successResponse('Organization deleted successfully.', {});
  }

  async addOrganisationUser(
    organisationId: string,
    payload: CreateOrganisationUserDto,
  ): Promise<ApiResponse> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Organization not found.');
    }

    const email = payload.email.toLowerCase();
    // const existingUser = await this.prisma.organisationUser.findUnique({ where: { email } });

    // if (existingUser) {
    //   return errorResponse(API_ERROR_CODES.CONFLICT, 'Organization user email already exists.');
    // }

    const cognitoResult = await this.cognitoService.createUser({
      email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      sendInvite: payload.sendInvite,
    });

    // const organisationUser = await this.prisma.organisationUsers.create({
    //   data: {
    //     organisationId,
    //     firstName: payload.firstName,
    //     lastName: payload.lastName ?? '',
    //     email,
    //     role: payload.role,
    //     status: payload.status ?? true,
    //     cognitoSub: cognitoResult.userSub,
    //   },
    // });

    return successResponse('Organization user created successfully.', {});
  }

  async getOrganisationUsers(organisationId: string): Promise<ApiResponse> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Organization not found.');
    }

    const users = await this.prisma.organisationUser.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse('Organization users retrieved successfully.', users);
  }

  async getOrganisationUserById(organisationId: string, id: string): Promise<ApiResponse> {
    const user = await this.prisma.organisationUser.findFirst({
      where: { id, organisationId },
    });

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Organization user not found.');
    }

    return successResponse('Organization user retrieved successfully.', user);
  }

  async updateOrganisationUser(
    organisationId: string,
    id: string,
    payload: UpdateOrganisationUserDto,
  ): Promise<ApiResponse> {
    const user = await this.prisma.organisationUser.findFirst({
      where: { id, organisationId },
    });

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Organization user not found.');
    }

    if (payload.email) {
      const email = payload.email.toLowerCase();
      // const existingUser = await this.prisma.organisationUser.findUnique({ where: { email } });

      // if (existingUser && existingUser.id !== id) {
      //   return errorResponse(API_ERROR_CODES.CONFLICT, 'Organization user email already exists.');
      // }

      payload.email = email;
    }

    // const updatedUser = await this.prisma.organisationUser.update({
    //   where: { id },
    //   data: payload,
    // });

    return successResponse('Organization user updated successfully.', {});
  }

  async deleteOrganisationUser(organisationId: string, id: string): Promise<ApiResponse> {
    const user = await this.prisma.organisationUser.findFirst({
      where: { id, organisationId },
    });

    if (!user) {
      return errorResponse(API_ERROR_CODES.NOT_FOUND, 'Organization user not found.');
    }

    await this.prisma.organisationUser.delete({ where: { id } });

    try {
      // await this.cognitoService.deleteUser(user.email);
    } catch {
      // Keep DB as source-of-truth in case Cognito account is absent.
    }

    return successResponse('Organization user deleted successfully.', {});
  }
}
