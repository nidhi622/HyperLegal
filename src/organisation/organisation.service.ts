import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';
import { ApiResponse } from 'src/utils/api-response';
import { CreateOrganisationData } from './dto/add-organisation.dto';

@Injectable()
export class OrganisationService {

    constructor(
    private prisma: PrismaService,
    private authService: AuthService // For Cognito SignUp integration
  ) {}

  // CREATE Organization
  async createOrganization(payload: CreateOrganisationData): Promise<ApiResponse> {
    const response = new ApiResponse('Organization created successfully');
    const normalizedEmail = payload.email.toLowerCase();

    const existing = await this.prisma.organisations.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      response.statusCode = 409;
      response.message = 'Organization email already exists';
      return response;
    }

    response.data = await this.prisma.organisations.create({
      data: { ...payload, email: normalizedEmail }
    });
    return response;
  }

  // READ All Organizations
  async getAllOrganizations(): Promise<ApiResponse> {
    const orgs = await this.prisma.organisations.findMany({
      // include: { organizationUsers: true } // Include staff count if needed
    });
    return new ApiResponse('Organizations retrieved', orgs);
  }

  // READ Single Organization
  async getOrganizationById(id: string): Promise<ApiResponse> {
    const org = await this.prisma.organisations.findUnique({
      where: { id },
      // include: { organizationUsers: true }
    });
    if (!org) return new ApiResponse('Organization not found', null, 404);
    return new ApiResponse('Organization retrieved', org);
  }

  // UPDATE Organization
  async updateOrganization(id: string, payload: UpdateOrganizationRequest): Promise<ApiResponse> {
    const response = new ApiResponse('Organization updated successfully');
    try {
      response.data = await this.prisma.organisations.update({
        where: { id },
        data: payload
      });
      return response;
    } catch (e) {
      response.statusCode = 404;
      response.message = 'Update failed: Organization not found';
      return response;
    }
  }

  // DELETE Organization
  async deleteOrganization(id: string): Promise<ApiResponse> {
    await this.prisma.organisations.delete({ where: { id } });
    return new ApiResponse('Organization deleted successfully');
  }

  // ADD USER TO ORGANIZATION (The specific request you asked for)
  async addOrganizationUser(payload: AddOrganizationUserRequest): Promise<ApiResponse> {
    const response = new ApiResponse('User added to organization successfully');
    const normalizedEmail = payload.email.toLowerCase();

    // 1. Check if Organization exists
    const org = await this.prisma.organisations.findUnique({ where: { id: payload.organizationId } });
    if (!org) {
      response.statusCode = 404;
      response.message = 'Organization not found';
      return response;
    }

    // 2. Check if User already exists in DB
    const existing = await this.prisma.organisationUsers.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      response.statusCode = 409;
      response.message = 'User email is already registered';
      return response;
    }

    try {
      // 3. Register in Cognito (Using the method we built in AuthService)
      const cognitoRes = await this.authService.addUser({
        email: normalizedEmail,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        sendInvite: true
      });

      // 4. Create local DB entry
      const newUser = await this.prisma.organisationUsers.create({
        data: {
          organisationId: payload.organizationId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: normalizedEmail,
          role: payload.role,
          cognitoSub: cognitoRes.UserSub
        }
      });

      response.data = newUser;
      return response;
    } catch (error) {
      response.statusCode = 500;
      response.message = 'Failed to link user to organization';
      response.error = error.message;
      return response;
    }
  }
}
