import env from 'src/helpers/env.helper';
interface configType {
  app: {
    name: string;
    url: string;
    environment: string;
    port: number;
  };
  db: {
    url: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;

    iAMUserAccessId: string;
    iAMUserSecretKey: string;
    cognito: {
      userPoolId: string;
      clientId: string;
    };
    dynamodb: {
      endpoint: string;
    };
    ses: {
      enpoint: string;
    };
  };
}
export const config: configType = {
  app: {
    name: env('APP_NAME', 'HyperLegal'),
    url: env('APP_URL', 'http://0.0.0.0:3000'),
    environment: env('APP_ENV', 'development'),
    port: Number(env('PORT', 3000)),
  },
  db: {
    url: env(
      'DATABASE_URL',
      'postgresql://hyperlegal:hyperlegal@db:5432/hyperlegal?schema=public',
    ),
  },
  aws: {
    region: env('AWS_REGION', 'eu-west-2'),
    accessKeyId: env('AWS_ACCESS_KEY_ID'),
    secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),

    iAMUserAccessId: env(
      'AWS_IAM_USER_ACCESS_KEY_ID',
      env('AWS_IAM_USER_ACCESS_ID'),
    ),
    iAMUserSecretKey: env(
      'AWS_IAM_USER_SECRET_ACCESS_KEY',
      env('AWS_IAM_USER_SECRET_KEY'),
    ),
    cognito: {
      userPoolId: env('COGNITO_USER_POOL_ID'),
      clientId: env('COGNITO_CLIENT_ID'),
    },
    ses: {
      enpoint: env('SES_ENDPOINT'),
    },
    dynamodb: {
      endpoint: env('DYNAMODB_ENDPOINT'),
    },
  },
};

export default config;
