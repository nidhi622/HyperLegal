// src/infrastructure/dynamodb.provider.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import config from 'src/configs/config';

export const DynamoDBProvider = {
  provide: 'DYNAMO_DB_CLIENT',
  useFactory: () => {
    const client = new DynamoDBClient({
      region: config.aws.region,
      endpoint: config.aws.dynamodb.endpoint, // undefined triggers real AWS
      credentials: {
        accessKeyId: config.aws.accessKeyId || 'fake',
        secretAccessKey: config.aws.secretAccessKey || 'fake',
      },
    });
    return DynamoDBDocumentClient.from(client);
  },
};
