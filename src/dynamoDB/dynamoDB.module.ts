// src/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { PrismaService } from 'src/database/prisma.service';
import config from 'src/configs/config';

@Global() // This makes it available everywhere without re-importing
@Module({
  providers: [
    {
      provide: 'DYNAMO_DB_CLIENT', // This MUST match your @Inject() string
      useFactory: () => {
        const endpoint = config.aws.dynamodb.endpoint || 'http://localhost:8000';

        const client = new DynamoDBClient({
          region: 'local',
          endpoint,
          maxAttempts: 1,
          requestHandler: new NodeHttpHandler({
            connectionTimeout: 2000,
            requestTimeout: 5000,
          }),
          credentials: {
            accessKeyId: config.aws.accessKeyId || 'gktsaw',
            secretAccessKey: config.aws.secretAccessKey || 'j9gcwp',
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
