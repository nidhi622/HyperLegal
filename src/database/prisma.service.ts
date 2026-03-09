import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import config from 'src/configs/config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = config.db.url;
    const adapter = new PrismaPg({connectionString });
    
    super({ adapter });
  }
}
