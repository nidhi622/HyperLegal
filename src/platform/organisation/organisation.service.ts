import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
import { GetOrganisationUserParamsDto } from './dto/get-organisation-user.dto';
import { SesService } from 'src/aws/ses.service';
import { CreateOrganisationUserDto } from './dto/create-organisation-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { UpdateOrganisationUserDto } from './dto/update-organisation-user.dto';
import { getStatusId, getStatusText } from 'src/helpers/global.helper';
import { ListOrganisationUsersDto } from './dto/list-organisation-users.dto';
import { CreateOrganisationUserByOrgDto } from './dto/create-organisation-user-by-org.dto';
import { PasswordResetRepository } from 'src/auth/repositories/password-reset.repository';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { UserStatus } from 'src/constant';

@Injectable()
export class OrganisationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cognitoService: CognitoService,
    private readonly sesService: SesService,
    private readonly authService: AuthService,
    private readonly tokenRepo: PasswordResetRepository,
    private readonly config: ConfigService,
  ) {}

  // async createOrganisation(
  //   payload: CreateOrganisationDto,
  //   actor?: { userId?: string },
  // ): Promise<ApiResponse> {
  //   const email = payload.email.toLowerCase();

  //   const existing = await this.prisma.organisation.findUnique({
  //     where: { email },
  //   });

  //   if (existing) {
  //     return errorResponse(
  //       API_ERROR_CODES.CONFLICT,
  //       'Organisation email already exists.',
  //     );
  //   }

  //   const referenceNumber = await this.getNextOrganisationReference();
  //   const actorUserId = actor?.userId ?? null;
  //   if (!actorUserId) {
  //     return errorResponse(
  //       API_ERROR_CODES.INVALID_TOKEN,
  //       'Authenticated user not found.',
  //     );
  //   }

  //   const organisation = await this.prisma.$transaction(async (tx) => {
  //     const created = await tx.organisation.create({
  //       data: {
  //         name: payload.name,
  //         email,
  //         referenceNumber,
  //         // domain: payload.domain,
  //         // redFlagPolicies: payload.redFlagPolicies as any,
  //         // status: payload.status ?? true,
  //         createdBy: actorUserId,
  //         updatedBy: actorUserId,
  //       },
  //     });

  //     await tx.organisationAuditLog.create({
  //       data: {
  //         organisationId: created.id,
  //         userId: actorUserId,
  //         action: 'ADDED_ORGNAISATION',
  //         details: created as any,
  //       },
  //     });

  //     return created;
  //   });

  //   return successResponse('Organisation added successfully.', organisation);
  // }

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
          // status: true,
          createdBy: userId,
        },
      });

      await tx.organisationAuditLog.create({
        data: {
          organisationId: newOrg.id,
          userId: userId,
          action: 'ADDED_ORGANISATION',
          details: `${JSON.stringify(newOrg)}`,
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
        status: getStatusText(org.status),
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
          status: getStatusId(dto.status),
          updatedBy: adminId,
        },
      });

      // 4. Detailed Audit Log (Previous vs New values)
      await tx.organisationAuditLog.create({
        data: {
          organisationId: id,
          userId: adminId,
          action: 'ORGANISATION_UPDATED',
          details: `{
            name: ${currentOrg.name},
            email: ${currentOrg.email},
            status: ${currentOrg.status},
          }`,
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

  // async updateOrganisation(
  //   id: string,
  //   payload: UpdateOrganisationDto,
  // ): Promise<ApiResponse> {
  //   const organisation = await this.prisma.organisation.findUnique({
  //     where: { id },
  //   });

  //   if (!organisation) {
  //     return errorResponse(
  //       API_ERROR_CODES.NOT_FOUND,
  //       'Organization not found.',
  //     );
  //   }

  //   if (payload.email) {
  //     const email = payload.email.toLowerCase();
  //     const existing = await this.prisma.organisation.findUnique({
  //       where: { email },
  //     });

  //     if (existing && existing.id !== id) {
  //       return errorResponse(
  //         API_ERROR_CODES.CONFLICT,
  //         'Organization email already exists.',
  //       );
  //     }

  //     payload.email = email;
  //   }

  //   const updatedOrganisation = await this.prisma.organisation.update({
  //     where: { id },
  //     data: {
  //       ...payload,
  //       // redFlagPolicies: payload.redFlagPolicies as any,
  //     },
  //   });

  //   return successResponse(
  //     'Organization updated successfully.',
  //     updatedOrganisation,
  //   );
  // }

  async getOrganisationUser(params: GetOrganisationUserParamsDto) {
    const { organisationId, userId } = params;

    // 1️⃣ Organisation exists?
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new NotFoundException([
        { organisationId: 'Organisation not found' },
      ]);
    }

    // 2️⃣ Organisation User exists?
    const orgUserRole = await this.prisma.organisationUserRole.findFirst({
      where: {
        organisationId,
        userId,
      },
      include: {
        user: true,
        role: true,
        organisation: true,
      },
    });

    if (!orgUserRole) {
      throw new NotFoundException([
        { userId: 'User does not belong to this organisation' },
      ]);
    }

    // 3️⃣ Get user status
    const orgUser = await this.prisma.organisationUser.findUnique({
      where: { userId, status: 1 },
      // include: {
      //   status: 1,
      // },
    });

    const creator = await this.prisma.user.findUnique({
      where: { id: orgUserRole.createdBy },
    });

    return {
      id: orgUserRole.user.id,
      organisation: {
        id: organisation.id,
        name: organisation.name,
      },
      firstName: orgUserRole.user.firstName,
      lastName: orgUserRole.user.lastName,
      email: orgUserRole.user.email,
      status: orgUser ? getStatusText(orgUser.status) : null,
      createdBy: `${creator?.firstName} ${creator?.lastName}`,
      createdAt: orgUserRole.createdAt,
      updatedBy: `${creator?.firstName} ${creator?.lastName}`,
      updatedAt: orgUserRole.createdAt,
    };
  }

  async listOrganisationUsers(
    organisationId: string,
    query: ListOrganisationUsersDto,
  ) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new NotFoundException([
        { organisationId: 'Organisation not found' },
      ]);
    }

    const page = query.page ?? 1;
    const take = query.take ?? 10;
    const limit = take > 100 ? 100 : take;
    const skip = query.skip ?? (page - 1) * limit;

    const [roles, total] = await Promise.all([
      this.prisma.organisationUserRole.findMany({
        where: { organisationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          organisation: true,
          creator: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.organisationUserRole.count({ where: { organisationId } }),
    ]);

    const userIds = roles.map((role) => role.userId);
    const orgUsers = userIds.length
      ? await this.prisma.organisationUser.findMany({
          where: { userId: { in: userIds } },
        })
      : [];
    const statusByUserId = new Map(
      orgUsers.map((orgUser) => [
        orgUser.userId,
        getStatusText(orgUser.status),
      ]),
    );

    return {
      data: roles.map((role) => ({
        id: role.user.id,
        organisation: {
          id: role.organisation.id,
          name: role.organisation.name,
        },
        firstName: role.user.firstName,
        lastName: role.user.lastName,
        email: role.user.email,
        status: statusByUserId.get(role.userId) ?? null,
        createdBy: role.creator
          ? `${role.creator.firstName} ${role.creator.lastName}`
          : null,
        createdAt: role.createdAt,
        updatedBy: role.creator
          ? `${role.creator.firstName} ${role.creator.lastName}`
          : null,
        updatedAt: role.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async createOrganisationUser(
    dto: CreateOrganisationUserDto,
    adminId: string,
  ) {
    const { email, firstName, lastName, organisationId } = dto;

    // Email Exists?
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException([{ email: 'Email already exists' }]);
    }

    // 2️⃣ Organisation Exists?
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new NotFoundException([
        { organisationId: 'Organisation not found' },
      ]);
    }

    // 3️⃣ Generate Temp Password
    const tempPassword = this.authService.generateTempPassword();

    console.log('tempPassword:: ', tempPassword);

    // 4️⃣ Create Cognito User
    const cognitoUser = await this.cognitoService.createOrganisationUser({
      email,
      firstName,
      lastName,
      password: tempPassword,
      sendInvite: true,
    });

    if (!cognitoUser || !cognitoUser.userSub) {
      throw new InternalServerErrorException([
        { cognitoUser: 'Cognito user not found' },
      ]);
    }

    // const userSub=await this.cognitoService.getOrganisationUser({
    //   email,
    // });

    console.log('congitoUser:: ', cognitoUser);

    // if(!userSub){
    //   throw new InternalServerErrorException([
    //     { userSub: 'Cognito user not found' },
    //   ]);
    // }

    // 5️⃣ DB Transaction
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          createdBy: adminId,
        },
      });

      await tx.organisationUser.create({
        data: {
          userId: user.id,
          cognitoSub: cognitoUser.userSub!,
          status: 2, // invited
        },
      });

      // Admin Role
      const role = await tx.organisationRole.findFirst({
        where: { name: 'Admin' },
      });

      if (!role) {
        throw new InternalServerErrorException([{ role: 'Role not found' }]);
      }

      console.log('role:: ', role);
      await tx.organisationUserRole.create({
        data: {
          organisationId,
          userId: user.id,
          roleId: role.id,
          createdBy: adminId,
        },
      });

      // Audit Log
      await tx.organisationAuditLog.create({
        data: {
          organisationId,
          userId: adminId,
          action: 'ORG Admin Created',
          details: `Admin created for ${email}`,
        },
      });
    });

    // 6️⃣ Send Email
    // await this.sesService.sendOrganisationInvite(email, tempPassword);
  }

  async createOrganisationUserByOrganisation(
    organisationId: string,
    dto: CreateOrganisationUserByOrgDto,
    actorUserId: string,
  ) {
    const roleNameMap: Record<
      CreateOrganisationUserByOrgDto['role'],
      string
    > = {
      ADMIN: 'Admin',
      'PERMISSIONED USER': 'Permissioned User',
      'STANDARD USER': 'Standard User',
    };

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new NotFoundException([
        { organisationId: 'Organisation not found' },
      ]);
    }

    const orgMembership = await this.prisma.organisationUserRole.findFirst({
      where: { organisationId, userId: actorUserId },
    });

    if (!orgMembership) {
      throw new ForbiddenException('User does not belong to this organisation');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException([{ email: 'Email already exists' }]);
    }

    const role = await this.prisma.organisationRole.findFirst({
      where: { name: roleNameMap[dto.role] },
    });

    if (!role) {
      throw new InternalServerErrorException([{ role: 'Role not found' }]);
    }

    const tempPassword = this.authService.generateTempPassword();
    const cognitoUser = await this.cognitoService.createOrganisationUser({
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      password: tempPassword,
      sendInvite: false,
    });

    if (!cognitoUser || !cognitoUser.userSub) {
      throw new InternalServerErrorException([
        { cognitoUser: 'Cognito user not found' },
      ]);
    }

    const token = randomBytes(32).toString('hex');
    const ttlSeconds = 7 * 24 * 60 * 60;

    let createdUserId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: dto.first_name,
          lastName: dto.last_name,
          email: dto.email,
          createdBy: actorUserId,
        },
      });
      createdUserId = user.id;

      await tx.organisationUser.create({
        data: {
          userId: user.id,
          cognitoSub: cognitoUser.userSub!,
          status: UserStatus.INVITED,
        },
      });

      await tx.organisationUserRole.create({
        data: {
          organisationId,
          userId: user.id,
          roleId: role.id,
          createdBy: actorUserId,
        },
      });

      await tx.organisationAuditLog.create({
        data: {
          organisationId,
          userId: actorUserId,
          action: 'User Added',
          details: `USER ID: ${user.id}`,
        },
      });
    });

    await this.tokenRepo.saveToken(
      createdUserId!,
      token,
      ttlSeconds,
    );

    const baseUrl =
      this.config.get<string>('BACKEND_URL') ??
      this.config.get<string>('APP_URL') ??
      '';
    const inviteLink = `${baseUrl}/organisation/set-password?token=${token}`;

    await this.sesService.sendResetPasswordEmail(dto.email, inviteLink);
  }

  async updateOrganisationUser(
    params: GetOrganisationUserParamsDto,
    dto: UpdateOrganisationUserDto,
    adminId: string,
  ) {
    const { organisationId, userId } = params;

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new NotFoundException([
        { organisationId: 'Organisation not found' },
      ]);
    }

    const orgUserRole = await this.prisma.organisationUserRole.findFirst({
      where: { organisationId, userId },
    });

    if (!orgUserRole) {
      throw new NotFoundException([
        { userId: 'User does not belong to this organisation' },
      ]);
    }

    const orgUser = await this.prisma.organisationUser.findUnique({
      where: { userId },
    });

    if (!orgUser) {
      throw new NotFoundException([{ userId: 'Organisation user not found' }]);
    }

    const statusValue = getStatusId(dto.status);

    if (statusValue === undefined) {
      throw new BadRequestException([{ status: 'Invalid status provided' }]);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          updatedBy: adminId,
        },
      });

      await tx.organisationUser.update({
        where: { userId },
        data: { status: statusValue },
      });

      await tx.organisationAuditLog.create({
        data: {
          organisationId,
          userId: adminId,
          action: 'Org Admin Updated',
          details: `Updated user ${userId}`,
        },
      });
    });
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
}
