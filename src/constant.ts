export const ENV = {
    APP_ENV: process.env.APP_ENV,
    APP_URL: process.env.APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
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
    SENTRY_DSN:process.env.SENTRY_DSN,
    LOG_RETENTION_DAYS: process.env.LOG_RETENTION_DAYS,
    AXIS_DATA_API_KEY: process.env.AXIS_DATA_API_KEY,
    AXIS_DATA_API_SECRET: process.env.AXIS_DATA_API_SECRET,
    CONCURRENCY: process.env.CONCURRENCY || '4',
    TOTALDATA: process.env.TOTAL_DATA || '173000',
    CHUNKSIZE: process.env.CHUNK_SIZE|| '1000',
};

export const SERVICE_NAME = "hotel-management-service"
export const CRON_INTERVAL = "0 12 * * *"
