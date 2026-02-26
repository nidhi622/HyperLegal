import env from 'src/helpers/env.helper';

export type VendorConfig = {
    baseUrl: string;
    apiKey: string;
    apiSecret: string;
    version?: string | number;
    baseImageUrl?: string;
    rateLimit?: number;
    totalData?: number;
    chunkSize?: number;
    cronExpression?: string;
};

export const axisDataConfig: VendorConfig = {
    baseUrl: env('AXIS_DATA_URL'),
    apiKey: env('AXIS_DATA_API_KEY'),
    apiSecret: env('AXIS_DATA_API_SECRET'),
    baseImageUrl: env('AXIS_DATA_IMAGE_URL'),
    rateLimit: parseInt(env('AXIS_DATA_RATE_LIMIT', '1000')),
    totalData: parseInt(env('AXIS_DATA_TOTAL_DATA', '173000')),
    chunkSize: parseInt(env('AXIS_DATA_CHUNK_SIZE', '1000')),
    cronExpression: env('AXIS_DATA_CRON_EXPRESSION', '*/15 * * * *'),
};

export const hotelbedsConfig: VendorConfig = {
    baseUrl: env('HOTELBEDS_URL'),
    apiKey: env('HOTELBEDS_API_KEY'),
    apiSecret: env('HOTELBEDS_API_SECRET'),
    version: env('HOTELBEDS_API_VERSION'),
    rateLimit: parseInt(env('HOTELBEDS_RATE_LIMIT', '1000')),
    totalData: parseInt(env('HOTELBEDS_TOTAL_DATA', '173000')),
    chunkSize: parseInt(env('HOTELBEDS_CHUNK_SIZE', '1000')),
    cronExpression: env('HOTELBEDS_CRON_EXPRESSION', '*/15 * * * *'),
};
