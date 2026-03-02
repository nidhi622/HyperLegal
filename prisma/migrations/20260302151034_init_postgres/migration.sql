-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('standard', 'admin');

-- CreateTable
CREATE TABLE "platform_users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "cognito_sub" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255),
    "red_flag_policies" JSONB,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_users" (
    "id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'standard',
    "cognito_sub" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_email_key" ON "platform_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_email_key" ON "organisations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_users_email_key" ON "organisation_users"("email");

-- AddForeignKey
ALTER TABLE "organisation_users" ADD CONSTRAINT "organisation_users_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
