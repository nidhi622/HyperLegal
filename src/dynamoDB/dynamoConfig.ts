export const getDynamoConfig = () => ({
  region: process.env.AWS_REGION || 'local',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
  },
});