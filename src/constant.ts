export const ENV = {
  // App
  APP_ENV: process.env.APP_ENV,
  APP_URL: process.env.APP_URL,
  PORT: process.env.PORT,

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // AWS
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

  // Cognito
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,

  // DynamoDB
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT,

  SES_ENDPOINT: process.env.SES_ENDPOINT,

  // Third-party APIs (existing)
  GRPC_URL: process.env.GRPC_URL,
  AXIS_DATA_URL: process.env.AXIS_DATA_URL,
  AXIS_DATA_IMAGE_URL: process.env.AXIS_DATA_IMAGE_URL,
  HOTELBEDS_URL: process.env.HOTELBEDS_URL,
  HOTELBEDS_API_KEY: process.env.HOTELBEDS_API_KEY,
  HOTELBEDS_API_SECRET: process.env.HOTELBEDS_API_SECRET,
  HOTELBEDS_API_VERSION: process.env.HOTELBEDS_API_VERSION || '1.0',
  GOOGLE_PLACE_URL: process.env.GOOGLE_PLACE_URL,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GOOGLE_RATE_LIMIT: process.env.GOOGLE_RATE_LIMIT,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOG_RETENTION_DAYS: process.env.LOG_RETENTION_DAYS,
  AXIS_DATA_API_KEY: process.env.AXIS_DATA_API_KEY,
  AXIS_DATA_API_SECRET: process.env.AXIS_DATA_API_SECRET,
  CONCURRENCY: process.env.CONCURRENCY || '4',
  TOTALDATA: process.env.TOTAL_DATA || '173000',
  CHUNKSIZE: process.env.CHUNK_SIZE || '1000',
};

export const SERVICE_NAME = 'hotel-management-service';
export const CRON_INTERVAL = '0 12 * * *';

export enum UserStatus {
  INVITED = 2,
  ACTIVE = 1,
  SUSPENDED = 3,
}

export const statusTextMap: Record<UserStatus, string> = {
  [UserStatus.INVITED]: 'INVITED',
  [UserStatus.ACTIVE]: 'ACTIVE',
  [UserStatus.SUSPENDED]: 'SUSPENDED',
};
