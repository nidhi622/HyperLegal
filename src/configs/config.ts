import env from 'src/helpers/env.helper';
import { axisDataConfig, hotelbedsConfig } from './vendors.config';

export const config = {
    app: {
        name: env('APP_NAME', 'Hotel Management Service'),
        url: env('APP_URL', 'http://0.0.0.0:3000'),
        environment: env('APP_ENV', 'development'),
    },
    db: {
        url: env('DATABASE_URL', 'mongodb://localhost:27017/hotel-management'),
    },
    vendors: {
        default: axisDataConfig,
        axisData: axisDataConfig,
        hotelbeds: hotelbedsConfig,
    },
    googlePlaces: {
        url: env('GOOGLE_PLACE_URL'),
        apiKey: env('GOOGLE_API_KEY'),
        rateLimit: parseInt(env('GOOGLE_RATE_LIMIT', '3')),
    },
    rabbbitMq:{
        url:env('RABBITMQ_URL')
    },
    sentry:{
        url:env('SENTRY_DSN')
    },
    cron:{
        concurrency: parseInt(env('CONCURRENCY', '3')),
        totalData: parseInt(env('TOTALDATA', '173000')),
        chunkSize: parseInt(env('CHUNKSIZE', '1000')),
    }

};
