import { Injectable, OnModuleInit } from '@nestjs/common';
// import { PrismaClient } from 'prisma/client/client';
// import { PrismaClient } from 'generated/prisma/client'
// import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
@Injectable()
export class PrismaService extends PrismaClient {
  // const connectionString = `${process.env.DATABASE_URL}`||'postgresql://hyperlegal:hyperlegal@db:5432/mydb?schema=hyperlegal';
  constructor() {
     const connectionString =
      process.env.DATABASE_URL ??
      'postgresql://hyperlegal:hyperlegal@db:5432/hyperlegal?schema=public';
    const adapter = new PrismaPg({connectionString });
    
    super({ adapter });
  }
//   async onModuleInit() {
//     await this.$connect();
//   }
}
