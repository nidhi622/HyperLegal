// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaService } from 'src/database/prisma.service';
// import { ApiResponse } from 'src/utils/api-response';

// @Injectable()
// export class UsersService {

//     constructor(
//     private prisma: PrismaService,
//     private config: ConfigService,
//     // Assuming you've injected the Cognito client or Auth Service
//   ){

//   }
//   async create(payload: CreatePlatformUserRequest): Promise<ApiResponse> {
//     const response = new ApiResponse('Platform user created successfully');
//     const normalizedEmail = payload.email.toLowerCase();

//     // Check-First Policy
//     const existing = await this.prisma.platformUsers.findUnique({
//       where: { email: normalizedEmail },
//     });
//     if (existing) {
//       response.statusCode = 409;
//       response.message = 'A platform user with this email already exists';
//       return response;
//     }

//     try {
//       // Create in Cognito (using SignUpCommand logic)
//       // Note: In a real flow, you'd call your AuthService.addUser here

//       const newUser = await this.prisma.platformUsers.create({
//         data: {
//           firstName: payload.firstName,
//           lastName: payload.lastName,
//           email: normalizedEmail,
//           role: payload.role,
//           status: true,
//           // cognitoSub: fromCognitoResponse.UserSub
//         },
//       });

//       response.data = newUser;
//       return response;
//     } catch (error) {
//       response.statusCode = 500;
//       response.message = 'Failed to onboard platform user';
//       response.error = error.message;
//       return response;
//     }
//   }

//   // 2. READ (Get All)
//   async findAll(): Promise<ApiResponse> {
//     const users = await this.prisma.platformUsers.findMany({
//       orderBy: { createdAt: 'desc' },
//     });
//     return new ApiResponse('Platform users retrieved', users);
//   }

//   // 3. READ (Get by ID)
//   async findOne(id: string): Promise<ApiResponse> {
//     const user = await this.prisma.platformUsers.findUnique({ where: { id } });
//     if (!user) {
//       return new ApiResponse('User not found', null, 404);
//     }
//     return new ApiResponse('User details retrieved', user);
//   }

//   // 4. UPDATE
//   async update(
//     id: string,
//     payload: UpdatePlatformUserRequest,
//   ): Promise<ApiResponse> {
//     try {
//       const updatedUser = await this.prisma.platformUsers.update({
//         where: { id },
//         data: payload,
//       });
//       return new ApiResponse('User updated successfully', updatedUser);
//     } catch (error) {
//       return new ApiResponse('Update failed', null, 404);
//     }
//   }

//   // 5. DELETE
//   async remove(id: string): Promise<ApiResponse> {
//     await this.prisma.platformUsers.delete({ where: { id } });
//     return new ApiResponse('User deleted successfully from platform');
//   }
// }
