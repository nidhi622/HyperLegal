// src/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { PrismaService } from 'src/database/prisma.service';

@Global() // This makes it available everywhere without re-importing
@Module({
  providers: [
    {
      provide: 'DYNAMO_DB_CLIENT', // This MUST match your @Inject() string
      useFactory: () => {
        const rawEndpoint = process.env.DYNAMODB_ENDPOINT?.trim();
        const endpoint = rawEndpoint || 'http://localhost:8000';

        const client = new DynamoDBClient({
          //   region: process.env.AWS_REGION || 'us-east-1',
          region: 'local',
          endpoint,
          maxAttempts: 1,
          requestHandler: new NodeHttpHandler({
            connectionTimeout: 2000,
            requestTimeout: 5000,
          }),
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'gktsaw',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'j9gcwp',
          },
        });
        return DynamoDBDocumentClient.from(client);
      },
    },
    PrismaService,
  ],
  exports: ['DYNAMO_DB_CLIENT', PrismaService],
})
export class DynamoDBModule {}
