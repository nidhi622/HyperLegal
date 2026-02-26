import { Injectable, OnModuleInit } from '@nestjs/common';
// import { PrismaClient } from 'prisma/client/client';
// import { PrismaClient } from 'generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from 'generated/prisma/client';
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaMariaDb(
      // { connectionLimit: 1 },
      // {
      //   database: process.env.DATABASE_URL|| "mysql://root:hyperlegal@db:3306/hyperlegal",
      //   onConnectionError: (err) => console.error("errr::",err, "DBURL:::",process.env.DATABASE_URL),
      // },

      process.env.DATABASE_URL || "mysql://root:hyperlegal@db:3306/hyperlegal", 
  {
    // connectionLimit: 10 // Put the limit here in the options
  }
    );
    
    super({ adapter });
  }
//   async onModuleInit() {
//     await this.$connect();
//   }
}
