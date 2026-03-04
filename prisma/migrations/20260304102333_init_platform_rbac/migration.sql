/*
  Warnings:

  - The primary key for the `organisation_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cognito_sub` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `firm_id` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `organisation_users` table. All the data in the column will be lost.
  - The `id` column on the `organisation_users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `organisations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `domain` on the `organisations` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `organisations` table. All the data in the column will be lost.
  - You are about to drop the column `red_flag_policies` on the `organisations` table. All the data in the column will be lost.
  - The `id` column on the `organisations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `platform_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `platform_users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `platform_users` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `platform_users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `platform_users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `platform_users` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `platform_users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `platform_users` table. All the data in the column will be lost.
  - The `id` column on the `platform_users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[invitation_token]` on the table `organisation_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cognito_sub]` on the table `platform_users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organisation_id` to the `organisation_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `organisation_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `platform_users` table without a default value. This is not possible if the table is not empty.
  - Made the column `cognito_sub` on table `platform_users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "organisation_users" DROP CONSTRAINT "organisation_users_firm_id_fkey";

-- DropIndex
DROP INDEX "organisation_users_email_key";

-- DropIndex
DROP INDEX "organisations_email_key";

-- DropIndex
DROP INDEX "platform_users_email_key";

-- AlterTable
ALTER TABLE "organisation_users" DROP CONSTRAINT "organisation_users_pkey",
DROP COLUMN "cognito_sub",
DROP COLUMN "email",
DROP COLUMN "firm_id",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "role",
ADD COLUMN     "invitation_token" TEXT,
ADD COLUMN     "organisation_id" UUID NOT NULL,
ADD COLUMN     "token_expiry" TIMESTAMP(3),
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "status" SET DEFAULT 'Invited',
ALTER COLUMN "status" SET DATA TYPE TEXT,
ADD CONSTRAINT "organisation_users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "organisations" DROP CONSTRAINT "organisations_pkey",
DROP COLUMN "domain",
DROP COLUMN "email",
DROP COLUMN "red_flag_policies",
ADD COLUMN     "primary_email" VARCHAR(255),
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "organisations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "platform_users" DROP CONSTRAINT "platform_users_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "role",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "cognito_sub" SET NOT NULL,
ADD CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform_role_id" UUID NOT NULL,
    "platform_permission_id" UUID NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "platform_role_id" UUID NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisation_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "organisation_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisation_id" UUID NOT NULL,
    "organisation_role_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "organisation_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisation_id" UUID,
    "user_id" UUID NOT NULL,
    "action_type" TEXT NOT NULL,
    "session_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisation_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "platform_roles_name_key" ON "platform_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "platform_permissions_name_key" ON "platform_permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_users_invitation_token_key" ON "organisation_users"("invitation_token");

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_cognito_sub_key" ON "platform_users"("cognito_sub");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_users" ADD CONSTRAINT "platform_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_permissions" ADD CONSTRAINT "platform_permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_platform_role_id_fkey" FOREIGN KEY ("platform_role_id") REFERENCES "platform_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_platform_permission_id_fkey" FOREIGN KEY ("platform_permission_id") REFERENCES "platform_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_user_roles" ADD CONSTRAINT "platform_user_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_user_roles" ADD CONSTRAINT "platform_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_user_roles" ADD CONSTRAINT "platform_user_roles_platform_role_id_fkey" FOREIGN KEY ("platform_role_id") REFERENCES "platform_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_users" ADD CONSTRAINT "organisation_users_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_users" ADD CONSTRAINT "organisation_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_roles" ADD CONSTRAINT "organisation_roles_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_user_roles" ADD CONSTRAINT "organisation_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_user_roles" ADD CONSTRAINT "organisation_user_roles_organisation_role_id_fkey" FOREIGN KEY ("organisation_role_id") REFERENCES "organisation_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_audit_logs" ADD CONSTRAINT "organisation_audit_logs_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_audit_logs" ADD CONSTRAINT "organisation_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
