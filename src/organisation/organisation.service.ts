import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { API_ERROR_CODES } from 'src/common/constants/error-codes';
import { CognitoService } from 'src/cognito/cognito.service';
import { PrismaService } from 'src/database/prisma.service';
import {
  ApiResponse,
  errorResponse,
  successResponse,
} from 'src/utils/api-response';
import { CreateOrganisationDto } from './dto/add-organisation.dto';
import { FindAllOrganisationsDto } from './dto/find-all-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';

@Injectable()
export class OrganisationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cognitoService: CognitoService,
  ) {}

  async createOrganisation(
    payload: CreateOrganisationDto,
    actor?: { userId?: string },
    sessionId?: string,
  ): Promise<ApiResponse> {
    const email = payload.email.toLowerCase();

    const existing = await this.prisma.organisation.findUnique({
      where: { email },
    });

    if (existing) {
      return errorResponse(
        API_ERROR_CODES.CONFLICT,
        'Organisation email already exists.',
      );
    }

    const referenceNumber = await this.getNextOrganisationReference();
    const actorUserId = actor?.userId ?? null;
    if (!actorUserId) {
      return errorResponse(
        API_ERROR_CODES.INVALID_TOKEN,
        'Authenticated user not found.',
      );
    }

    const organisation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organisation.create({
        data: {
          name: payload.name,
          email,
          referenceNumber,
          // domain: payload.domain,
          // redFlagPolicies: payload.redFlagPolicies as any,
          status: payload.status ?? true,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
      });

      await tx.organisationAuditLog.create({
        data: {
          organisationId: created.id,
          userId: actorUserId,
          actionType: 'ADDED_ORGNAISATION',
          sessionId: sessionId ? String(sessionId) : null,
          newValues: created as any,
        },
      });

      return created;
    });

    return successResponse('Organisation added successfully.', organisation);
  }

  async create(dto: CreateOrganisationDto, userId: string) {
    // 1. Check-First: Unique Email (Outside transaction is fine for business logic check)
    const existing = await this.prisma.organisation.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException([
        { field: 'email', message: 'Email already exists.' },
      ]);
    }

    // 2. Atomic Transaction for Data + Audit
    return await this.prisma.$transaction(async (tx) => {
      // Move count inside to prevent race conditions for the OID
      const totalOrgs = await tx.organisation.count();
      const refNumber = `OID-${(totalOrgs + 1).toString().padStart(2, '0')}`;

      const newOrg = await tx.organisation.create({
        data: {
          name: dto.name,
          email: dto.email,
          referenceNumber: refNumber,
          status: true,
          createdBy: userId,
        },
      });

      await tx.organisationAuditLog.create({
        data: {
          organisationId: newOrg.id,
          userId: userId,
          actionType: 'ADDED_ORGANISATION',
          newValues: {
            name: newOrg.name,
            email: newOrg.email,
            status: true,
          },
          // If your schema has sessionId, remember to pass it here from req if available
        },
      });

      return newOrg;
    });
  }

  async findAll(query: FindAllOrganisationsDto) {
    // Use your DTO type here instead of 'any'
    const { skip = 0, take = 10, sort, search } = query;

    const limit = take > 100 ? 100 : take;

    // Use Prisma.OrganisationWhereInput for type safety
    const where = search?.value
      ? {
          OR: [
            { name: { contains: search.value, mode: 'insensitive' as const } },
            { email: { contains: search.value, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.organisation.findMany({
        where,
        skip,
        take: limit,
        // Fallback to createdAt desc if sort is missing
        orderBy: sort?.field
          ? { [sort.field]: sort.dir }
          : { createdAt: 'desc' },
        include: {
          creator: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.organisation.count({ where }),
    ]);

    return {
      data: data.map((org) => ({
        uuid: org.id,
        reference_number: org.referenceNumber,
        name: org.name,
        email: org.email,
        status: org.status,
        created_at: org.createdAt,
        created_by: org.creator
          ? `${org.creator.firstName} ${org.creator.lastName}`
          : 'System',
      })),
      meta: {
        total,
        page: query.page || Math.floor(skip / limit) + 1,
        limit,
      },
    };
  }

  async findOne(id: string) {
    // Check-First: Does it exist?
    const org = await this.prisma.organisation.findUnique({
      where: { id },
      include: {
        creator: { select: { firstName: true, lastName: true } },
        updater: { select: { firstName: true, lastName: true } },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organisation with ID ${id} not found.`);
    }

    return {
      uuid: org.id,
      referenceNumber: org.referenceNumber,
      name: org.name,
      email: org.email,
      status: org.status,
      createdAt: org.createdAt,
      createdBy: org.creator
        ? `${org.creator.firstName} ${org.creator.lastName}`
        : 'System',
      updatedAt: org.updatedAt,
      updatedBy: org.updater
        ? `${org.updater.firstName} ${org.updater.lastName}`
        : 'N/A',
    };
  }

  // UPDATE LOGIC
  async update(id: string, dto: UpdateOrganisationDto, adminId: string) {
    // 1. Check-First: Does the record exist? (Requirement: 404 if missing)
    const currentOrg = await this.prisma.organisation.findUnique({
      where: { id },
    });

    if (!currentOrg) {
      throw new NotFoundException(`Organisation with ID ${id} not found.`);
    }

    // 2. Check-First: Is the new email taken by another organisation?
    if (dto.email !== currentOrg.email) {
      const emailExists = await this.prisma.organisation.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (emailExists) {
        throw new ConflictException([
          { field: 'email', message: 'Email already in use by another firm.' },
        ]);
      }
    }

    // 3. Perform Transaction for Update + Audit
    return await this.prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organisation.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email,
          status: dto.status,
          updatedBy: adminId,
        },
      });

      // 4. Detailed Audit Log (Previous vs New values)
      await tx.organisationAuditLog.create({
        data: {
          organisationId: id,
          userId: adminId,
          actionType: 'ORGANISATION_UPDATED',
          oldValues: {
            name: currentOrg.name,
            email: currentOrg.email,
            status: currentOrg.status,
          },
          newValues: {
            name: dto.name,
            email: dto.email,
            status: dto.status,
          },
        },
      });

      return updatedOrg;
    });
  }

  private async getNextOrganisationReference(): Promise<string> {
    const rows = await this.prisma.$queryRaw<{ next: number }[]>`
      SELECT COALESCE(
        MAX(NULLIF(regexp_replace(reference_number, '^OID-', ''), '')::int),
        0
      ) + 1 AS "next"
      FROM organisations
    `;
    const nextNumber = rows[0]?.next ?? 1;
    return `OID-${nextNumber}`;
  }

  async getAllOrganisations(): Promise<ApiResponse> {
    const organisations = await this.prisma.organisation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(
      'Organizations retrieved successfully.',
      organisations,
    );
  }

  async getOrganisationById(id: string): Promise<ApiResponse> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
    });

    if (!organisation) {
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'Organization not found.',
      );
    }

    return successResponse(
      'Organization retrieved successfully.',
      organisation,
    );
  }

  async updateOrganisation(
    id: string,
    payload: UpdateOrganisationDto,
  ): Promise<ApiResponse> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
    });

    if (!organisation) {
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'Organization not found.',
      );
    }

    if (payload.email) {
      const email = payload.email.toLowerCase();
      const existing = await this.prisma.organisation.findUnique({
        where: { email },
      });

      if (existing && existing.id !== id) {
        return errorResponse(
          API_ERROR_CODES.CONFLICT,
          'Organization email already exists.',
        );
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

    return successResponse(
      'Organization updated successfully.',
      updatedOrganisation,
    );
  }

  async deleteOrganisation(id: string): Promise<ApiResponse> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
    });

    if (!organisation) {
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'Organization not found.',
      );
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
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'Organization not found.',
      );
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
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'Organization not found.',
      );
    }

    const users = await this.prisma.organisationUser.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse('Organization users retrieved successfully.', users);
  }

  async getOrganisationUserById(
    organisationId: string,
    id: string,
  ): Promise<ApiResponse> {
    const user = await this.prisma.organisationUser.findFirst({
      where: { id, organisationId },
    });

    if (!user) {
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'Organization user not found.',
      );
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
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'Organization user not found.',
      );
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

  async deleteOrganisationUser(
    organisationId: string,
    id: string,
  ): Promise<ApiResponse> {
    const user = await this.prisma.organisationUser.findFirst({
      where: { id, organisationId },
    });

    if (!user) {
      return errorResponse(
        API_ERROR_CODES.NOT_FOUND,
        'Organization user not found.',
      );
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
