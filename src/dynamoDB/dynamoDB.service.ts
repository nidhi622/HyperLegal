// src/infrastructure/dynamodb.provider.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const DynamoDBProvider = {
  provide: 'DYNAMO_DB_CLIENT',
  useFactory: () => {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // undefined triggers real AWS
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
      },
    });
    return DynamoDBDocumentClient.from(client);
  },
};