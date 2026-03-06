import env from 'src/helpers/env.helper';
// import { axisDataConfig, hotelbedsConfig } from './vendors.config';

export const config = {
    app: {
        name: env('APP_NAME', 'Hotel Management Service'),
        url: env('APP_URL', 'http://0.0.0.0:3000'),
        environment: env('APP_ENV', 'development'),
    },
    db: {
        url: env('DATABASE_URL', 'postgresql://hyperlegal:hyperlegal@db:5432/mydb?schema=hyperlegal'),
    },
    aws: {
    region: process.env.AWS_REGION,
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      clientId: process.env.COGNITO_CLIENT_ID,
    },
  },
    

};
