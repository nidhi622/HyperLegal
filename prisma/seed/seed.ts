// import { PrismaPg } from '@prisma/adapter-pg';
// import { PrismaClient } from 'generated/prisma/client';

// const connectionString =
//   process.env.DATABASE_URL ??
//   'postgresql://hyperlegal:hyperlegal@db:5432/hyperlegal?schema=public';
// const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter });

// async function main() {
//   // 1️⃣ Create platform_admin role
//   const platformAdminRole = await prisma.platformRole.upsert({
//     where: { name: 'platform_admin' },
//     update: {},
//     create: {
//       name: 'platform_admin',
//     },
//   });

//   // 2️⃣ Create Admin User
//   const adminUser = await prisma.user.upsert({
//     where: { email: 'dev@hyperlegat.dev' },
//     update: {},
//     create: {
//       firstName: 'Dev',
//       lastName: 'Admin',
//       email: 'dev@hyperlegat.dev',
//     },
//   });

//   // 3️⃣ Insert into platform_users
//   const platformUser = await prisma.platformUser.upsert({
//     where: { cognitoSub: 'c6c242c4-9001-7019-668e-6fc02571d423' },
//     update: {},
//     create: {
//       userId: adminUser.id,
//       cognitoSub: 'c6c242c4-9001-7019-668e-6fc02571d423',
//     },
//   });

//   // 4️⃣ Map role to user
//   await prisma.platformUserRole.upsert({
//     where: {
//       userId_roleId: {
//         userId: adminUser.id,
//         roleId: platformAdminRole.id,
//       },
//     },
//     update: {},
//     create: {
//       userId: adminUser.id,
//       roleId: platformAdminRole.id,
//     },
//   });

//   console.log('✅ Seed completed successfully');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

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
  console.log('🔄 Connecting to database...');
  await prisma.$connect();
  console.log('✅ Connected successfully');

  // 1️⃣ Create platform_admin role
  console.log('🔄 Creating platform_admin role...');
  const platformAdminRole = await prisma.platformRole.upsert({
    where: { name: 'platform_admin' },
    update: {},
    create: {
      name: 'platform_admin',
    },
  });
  console.log('✅ Role created:', platformAdminRole.id);

  // 2️⃣ Create Admin User
  console.log('🔄 Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'dev@hyperlegat.dev' },
    update: {},
    create: {
      firstName: 'Dev',
      lastName: 'Admin',
      email: 'dev@hyperlegat.dev',
    },
  });
  console.log('✅ Admin user:', adminUser.id);

  // 3️⃣ Insert into platform_users
  console.log('🔄 Creating platform_user...');
  const platformUser = await prisma.platformUser.upsert({
    where: { cognitoSub: 'c6c242c4-9001-7019-668e-6fc02571d423' },
    update: {},
    create: {
      userId: adminUser.id,
      cognitoSub: 'c6c242c4-9001-7019-668e-6fc02571d423',
    },
  });
  console.log('✅ Platform user:', platformUser.id);

  // 4️⃣ Map role to user
  console.log('🔄 Mapping role to user...');
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
    },
  });

  console.log('🎉 Role mapped successfully');
}

main()
  .catch((e) => {
    console.error('❌ SEED ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting...');
    await prisma.$disconnect();
    console.log('👋 Seed finished');
  });
