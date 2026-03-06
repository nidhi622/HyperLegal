import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock }; platformUser: { update: jest.Mock } };
  let cognitoSend: jest.Mock;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      platformUser: {
        update: jest.fn(),
      },
    };

    cognitoSend = jest.fn();

    service = new AuthService(
      {
        get: jest.fn((key: string) => {
          if (key === 'COGNITO_CLIENT_ID') return 'test-client-id';
          if (key === 'COGNITO_CLIENT_SECRET') return 'test-client-secret';
          return undefined;
        }),
      } as any,
      prisma as any,
    );

    (service as any).client = { send: cognitoSend };
  });

  it('returns tokens for valid platform admin credentials', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-id',
      platformUsers: [{ id: 'platform-user-id' }],
      platformUserRoles: [{ id: 'role-map-id' }],
    });
    cognitoSend.mockResolvedValueOnce({
      AuthenticationResult: {
        AccessToken: 'access-token',
        RefreshToken: 'refresh-token',
        IdToken: 'id-token',
        ExpiresIn: 3600,
        TokenType: 'Bearer',
      },
    });
    prisma.platformUser.update.mockResolvedValueOnce({
      id: 'platform-user-id',
    });

    const result = await service.adminLogin('Admin@HyperLegal.dev', 'P@ssword123');

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      idToken: 'id-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    });
    expect(prisma.platformUser.update).toHaveBeenCalledTimes(1);
  });

  it('throws unauthorized for invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-id',
      platformUsers: [{ id: 'platform-user-id' }],
      platformUserRoles: [{ id: 'role-map-id' }],
    });
    cognitoSend.mockRejectedValueOnce({ name: 'NotAuthorizedException' });

    await expect(service.adminLogin('admin@hyperlegal.dev', 'wrong-password')).rejects.toThrow(
      new UnauthorizedException('Invalid email or password.'),
    );
  });

  it('throws unauthorized when user is not a platform admin', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-id',
      platformUsers: [{ id: 'platform-user-id' }],
      platformUserRoles: [],
    });

    await expect(service.adminLogin('user@hyperlegal.dev', 'P@ssword123')).rejects.toThrow(
      new UnauthorizedException('Unauthorized access.'),
    );
    expect(cognitoSend).not.toHaveBeenCalled();
  });
});
