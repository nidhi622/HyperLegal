import config from 'src/configs/config';

export const awsConfig = {
  region: config.aws.region || 'local',
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
};
