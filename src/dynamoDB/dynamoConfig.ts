import config from 'src/configs/config';

export const getDynamoConfig = () => ({
  region: config.aws.region || 'local',
  endpoint: config.aws.dynamodb.endpoint || 'http://localhost:8000',
  credentials: {
    accessKeyId: config.aws.accessKeyId || 'fake',
    secretAccessKey: config.aws.secretAccessKey || 'fake',
  },
});
