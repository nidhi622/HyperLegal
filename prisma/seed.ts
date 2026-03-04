import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { randomUUID } from 'crypto';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://hyperlegal:hyperlegal@db:5432/hyperlegal?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const platformPermissions = [
  'platform_users.create',
  'platform_users.read',
  'platform_users.update',
  'platform_users.delete',
  'organisations.create',
  'organisations.read',
  'organisations.update',
  'organisations.delete',
] as const;

const rolePermissionMap: Record<string, string[]> = {
  admin: [...platformPermissions],
  standard: ['platform_users.read', 'organisations.read'],
};

async function main() {
  for (const permissionName of platformPermissions) {
    await prisma.$executeRaw`
      INSERT INTO platform_permissions (id, name, created_at, updated_at)
      VALUES (${randomUUID()}, ${permissionName}, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    `;
  }

  for (const roleName of Object.keys(rolePermissionMap)) {
    await prisma.$executeRaw`
      INSERT INTO platform_roles (id, name, created_at, updated_at)
      VALUES (${randomUUID()}, ${roleName}, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    `;
  }

  for (const [roleName, permissionNames] of Object.entries(rolePermissionMap)) {
    const roleRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM platform_roles WHERE name = ${roleName} LIMIT 1
    `;
    const roleId = roleRows[0]?.id;
    if (!roleId) {
      continue;
    }

    for (const permissionName of permissionNames) {
      const permissionRows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM platform_permissions WHERE name = ${permissionName} LIMIT 1
      `;
      const permissionId = permissionRows[0]?.id;
      if (!permissionId) {
        continue;
      }

      await prisma.$executeRaw`
        INSERT INTO platform_role_permissions
          (id, platform_role_id, platform_permission_id, created_at, updated_at)
        VALUES (${randomUUID()}, ${roleId}, ${permissionId}, NOW(), NOW())
        ON CONFLICT (platform_role_id, platform_permission_id)
        DO UPDATE SET updated_at = NOW()
      `;
    }
  }

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  if (!seedAdminEmail) {
    return;
  }

  const [adminRoleRows, adminPlatformUserRows] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM platform_roles WHERE name = 'admin' LIMIT 1
    `,
    prisma.$queryRaw<{ id: string }[]>`
      SELECT pu.id
      FROM platform_users pu
      JOIN users u ON u.id = pu.user_id
      WHERE u.email = ${seedAdminEmail}
      LIMIT 1
    `,
  ]);
  const adminRoleId = adminRoleRows[0]?.id;
  const adminPlatformUserId = adminPlatformUserRows[0]?.id;

  if (!adminRoleId || !adminPlatformUserId) {
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO platform_user_roles (id, user_id, platform_role_id, created_at, updated_at)
    VALUES (${randomUUID()}, ${adminPlatformUserId}, ${adminRoleId}, NOW(), NOW())
    ON CONFLICT (user_id, platform_role_id)
    DO UPDATE SET updated_at = NOW()
  `;
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
