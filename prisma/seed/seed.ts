import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

console.log('🚀 Starting seed...');

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://hyperlegal:hyperlegal@db:5432/hyperlegal?schema=public';

console.log('🔌 Using connection string:', connectionString);

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('=================================================');
  console.log('🌱 Starting Unified Seed Script');
  console.log('=================================================');

  /* ------------------------------------------------ */
  console.log('👤 Step 1: Creating / Upserting Admin User');

  const adminUser = await prisma.user.upsert({
    where: { email: 'dev@hyperlegal.dev' },
    update: {},
    create: {
      firstName: 'Dev',
      lastName: 'Admin',
      email: 'dev@hyperlegal.dev',
    },
  });

  console.log('✅ Admin user ready:', adminUser.id);

  /* ------------------------------------------------ */
  console.log('📦 Step 2: Seeding Lookup Entities');

  // const platformStatus = await prisma.entity.upsert({
  //   where: { id: 1 },
  //   update: {},
  //   create: {
  //     id: 1,
  //     key: 'PLATFORM_USER_STATUS',
  //     name: 'Platform User Status',
  //     options: {
  //       create: [{ id: 1, name: 'Active' }],
  //     },
  //   },
  // });

  console.log('✅ Platform User Status seeded');

  // const orgStatus = await prisma.entity.upsert({
  //   where: { id: 2 },
  //   update: {},
  //   create: {
  //     id: 2,
  //     key: 'ORGANISATION_USER_STATUS',
  //     name: 'Organisation User Status',
  //     options: {
  //       create: [
  //         { id: 2, name: 'Invited' },
  //         { id: 3, name: 'Active' },
  //         { id: 4, name: 'Suspended' },
  //       ],
  //     },
  //   },
  // });

  console.log('✅ Organisation User Status seeded');

  /* ------------------------------------------------ */
  console.log('🔐 Step 3: Creating Platform Admin Role');

  const platformAdminRole = await prisma.platformRole.upsert({
    where: { name: 'platform_admin' },
    update: {},
    create: {
      name: 'platform_admin',
      createdBy: adminUser.id,
    },
  });

  console.log('✅ Platform role ready:', platformAdminRole.name);

  const platformPerms = [
    'organisation.view.list',
    'organisation.view.details',
    'organisation.create',
    'organisation.update',
    'organisation.delete',
    'organisation.enable',
    'organisation.disable',
    'organisation.user.view.list',
    'organisation.user.view.details',
    'organisation.user.create',
    'organisation.user.update',
    'organisation.user.delete',
    'organisation.user.enable',
    'organisation.user.disable',
  ];

  console.log(`🔑 Seeding ${platformPerms.length} platform permissions`);

  for (const name of platformPerms) {
    const perm = await prisma.platformPermission.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    console.log(`   ➜ Permission ready: ${name}`);

    await prisma.platformRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: platformAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: platformAdminRole.id,
        permissionId: perm.id,
        createdBy: adminUser.id,
      },
    });
  }

  console.log('✅ Platform role-permission mapping complete');

  /* ------------------------------------------------ */
  console.log('👤 Step 4: Creating Platform User');

  const platformUser = await prisma.platformUser.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      cognitoSub: 'c6c242c4-9001-7019-668e-6fc02571d423',
      status: 1,
    },
  });

  console.log('✅ Platform user created');

  await prisma.platformUserRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: platformAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: platformAdminRole.id,
      createdBy: adminUser.id,
    },
  });

  console.log('✅ Platform user-role mapping done');

  /* ------------------------------------------------ */
  console.log('🏢 Step 5: Seeding Organisation Permissions');

  const orgPermissionsList = [
    'organisation.policy.create',
    'organisation.policy.view',
    'organisation.policy.update',
    'organisation.client.list',
    'organisation.client.view',
    'organisation.matter.list',
    'organisation.matter.view',
    'organisation.matter.form.generate',
    'organisation.risk_assessment.run',
    'organisation.risk_assessment.view',
    'organisation.risk_assessment.update',
    'organisation.user.view.list',
    'organisation.user.view.details',
    'organisation.user.create',
    'organisation.user.update',
    'organisation.user.delete',
    'organisation.user.invite.resend',
    'organisation.user.password.reset',
    'organisation.activity.view.list',
    'organisation.activity.view.details',
  ];

  const permissionedSubset = [
    'organisation.client.list',
    'organisation.client.view',
    'organisation.matter.list',
    'organisation.matter.view',
    'organisation.matter.form.generate',
    'organisation.risk_assessment.run',
    'organisation.risk_assessment.view',
    'organisation.risk_assessment.update',
    'organisation.activity.view.list',
    'organisation.activity.view.details',
  ];

  const createdOrgPerms: Record<string, string> = {};

  for (const name of orgPermissionsList) {
    const p = await prisma.organisationPermission.upsert({
      where: { name },
      update: {},
      create: { name, organisationId: null },
    });

    createdOrgPerms[name] = p.id;

    console.log(`   ➜ Org permission ready: ${name}`);
  }

  console.log('✅ Organisation permissions seeded');

  /* ------------------------------------------------ */
  console.log('👥 Step 6: Creating Organisation Roles');

  const orgRoles = [
    { name: 'Admin', perms: orgPermissionsList },
    { name: 'Permissioned User', perms: permissionedSubset },
    { name: 'Standard User', perms: [] },
  ];

  for (const r of orgRoles) {
    const role = await prisma.organisationRole.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        createdBy: adminUser.id,
        organisationId: null,
      },
    });

    console.log(`   ➜ Role ready: ${r.name}`);

    for (const pName of r.perms) {
      await prisma.organisationRolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: createdOrgPerms[pName],
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: createdOrgPerms[pName],
          createdBy: adminUser.id,
        },
      });
    }

    console.log(`   ✔ Permissions mapped for role: ${r.name}`);
  }

  console.log('✅ Organisation RBAC setup complete');

  /* ------------------------------------------------ */
  console.log('📝 Step 7: Writing Platform Audit Log');

  await prisma.platformAuditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SEED_DATABASE',
      details:
        'Initial deployment of Platform and Organisation RBAC tables and default Admin user.',
    },
  });

  console.log('✅ Audit log inserted');

  console.log('=================================================');
  console.log('🎉 Seed Completed Successfully');
  console.log('=================================================');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting Prisma...');
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected');
  });