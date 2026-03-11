/*
  Warnings:

  - The primary key for the `organisation_audit_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `action_type` on the `organisation_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `new_values` on the `organisation_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `old_values` on the `organisation_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `session_id` on the `organisation_audit_logs` table. All the data in the column will be lost.
  - The `id` column on the `organisation_audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `organisation_role_id` on the `organisation_user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `invitation_token` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `organisation_id` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `token_expiry` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `organisation_users` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `organisations` table. All the data in the column will be lost.
  - You are about to drop the column `red_flag_policies` on the `organisations` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `organisations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to drop the column `platform_permission_id` on the `platform_role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `platform_role_id` on the `platform_role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `platform_role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `platform_role_id` on the `platform_user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `platform_user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `platform_users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `organisation_roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cognito_sub]` on the table `organisation_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference_number]` on the table `organisations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[role_id,permission_id]` on the table `platform_role_permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,role_id]` on the table `platform_user_roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `organisation_audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `details` to the `organisation_audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `organisation_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `organisation_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `organisation_user_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `organisation_user_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cognito_sub` to the `organisation_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_id` to the `organisation_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference_number` to the `organisations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permission_id` to the `platform_role_permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `platform_role_permissions` table without a default value. This is not possible if the table is not empty.
  - Made the column `created_by` on table `platform_role_permissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `platform_roles` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `role_id` to the `platform_user_roles` table without a default value. This is not possible if the table is not empty.
  - Made the column `created_by` on table `platform_user_roles` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `status_id` to the `platform_users` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `cognito_sub` on the `platform_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "organisation_roles" DROP CONSTRAINT "organisation_roles_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "organisation_user_roles" DROP CONSTRAINT "organisation_user_roles_organisation_role_id_fkey";

-- DropForeignKey
ALTER TABLE "organisation_users" DROP CONSTRAINT "organisation_users_organisation_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_role_permissions" DROP CONSTRAINT "platform_role_permissions_created_by_fkey";

-- DropForeignKey
ALTER TABLE "platform_role_permissions" DROP CONSTRAINT "platform_role_permissions_platform_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_role_permissions" DROP CONSTRAINT "platform_role_permissions_platform_role_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_roles" DROP CONSTRAINT "platform_roles_created_by_fkey";

-- DropForeignKey
ALTER TABLE "platform_user_roles" DROP CONSTRAINT "platform_user_roles_created_by_fkey";

-- DropForeignKey
ALTER TABLE "platform_user_roles" DROP CONSTRAINT "platform_user_roles_platform_role_id_fkey";

-- DropIndex
DROP INDEX "organisation_audit_logs_organisation_id_idx";

-- DropIndex
DROP INDEX "organisation_audit_logs_user_id_idx";

-- DropIndex
DROP INDEX "organisation_roles_organisation_id_idx";

-- DropIndex
DROP INDEX "organisation_user_roles_organisation_id_idx";

-- DropIndex
DROP INDEX "organisation_user_roles_organisation_id_user_id_organisatio_key";

-- DropIndex
DROP INDEX "organisation_user_roles_organisation_role_id_idx";

-- DropIndex
DROP INDEX "organisation_user_roles_user_id_idx";

-- DropIndex
DROP INDEX "organisation_users_invitation_token_key";

-- DropIndex
DROP INDEX "organisation_users_organisation_id_idx";

-- DropIndex
DROP INDEX "organisation_users_user_id_idx";

-- DropIndex
DROP INDEX "platform_role_permissions_platform_permission_id_idx";

-- DropIndex
DROP INDEX "platform_role_permissions_platform_role_id_idx";

-- DropIndex
DROP INDEX "platform_role_permissions_platform_role_id_platform_permiss_key";

-- DropIndex
DROP INDEX "platform_user_roles_platform_role_id_idx";

-- DropIndex
DROP INDEX "platform_user_roles_user_id_idx";

-- DropIndex
DROP INDEX "platform_user_roles_user_id_platform_role_id_key";

-- DropIndex
DROP INDEX "platform_users_user_id_idx";

-- AlterTable
ALTER TABLE "organisation_audit_logs" DROP CONSTRAINT "organisation_audit_logs_pkey",
DROP COLUMN "action_type",
DROP COLUMN "new_values",
DROP COLUMN "old_values",
DROP COLUMN "session_id",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "details" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "organisation_audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "organisation_roles" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by" UUID,
ALTER COLUMN "organisation_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "organisation_user_roles" DROP COLUMN "organisation_role_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" UUID NOT NULL,
ADD COLUMN     "role_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "organisation_users" DROP COLUMN "invitation_token",
DROP COLUMN "organisation_id",
DROP COLUMN "status",
DROP COLUMN "token_expiry",
DROP COLUMN "updated_at",
ADD COLUMN     "cognito_sub" UUID NOT NULL,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "status_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "organisations" DROP COLUMN "domain",
DROP COLUMN "red_flag_policies",
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "reference_number" VARCHAR(50) NOT NULL,
ADD COLUMN     "updated_by" UUID,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "platform_role_permissions" DROP COLUMN "platform_permission_id",
DROP COLUMN "platform_role_id",
DROP COLUMN "updated_at",
ADD COLUMN     "permission_id" UUID NOT NULL,
ADD COLUMN     "role_id" UUID NOT NULL,
ALTER COLUMN "created_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "platform_roles" ALTER COLUMN "created_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "platform_user_roles" DROP COLUMN "platform_role_id",
DROP COLUMN "updated_at",
ADD COLUMN     "role_id" UUID NOT NULL,
ALTER COLUMN "created_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "platform_users" DROP COLUMN "status",
ADD COLUMN     "status_id" INTEGER NOT NULL,
DROP COLUMN "cognito_sub",
ADD COLUMN     "cognito_sub" UUID NOT NULL;

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "entities" (
    "id" INTEGER NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_options" (
    "id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "entity_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisation_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "organisation_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisation_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platfrom_audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "details" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platfrom_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organisation_permissions_name_key" ON "organisation_permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_role_permissions_role_id_permission_id_key" ON "organisation_role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_roles_name_key" ON "organisation_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_users_cognito_sub_key" ON "organisation_users"("cognito_sub");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_reference_number_key" ON "organisations"("reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "platform_role_permissions_role_id_permission_id_key" ON "platform_role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_user_roles_user_id_role_id_key" ON "platform_user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_cognito_sub_key" ON "platform_users"("cognito_sub");

-- AddForeignKey
ALTER TABLE "entity_options" ADD CONSTRAINT "entity_options_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_users" ADD CONSTRAINT "platform_users_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "entity_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "platform_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "platform_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_user_roles" ADD CONSTRAINT "platform_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "platform_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_user_roles" ADD CONSTRAINT "platform_user_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_users" ADD CONSTRAINT "organisation_users_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "entity_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_roles" ADD CONSTRAINT "organisation_roles_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_roles" ADD CONSTRAINT "organisation_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_roles" ADD CONSTRAINT "organisation_roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_permissions" ADD CONSTRAINT "organisation_permissions_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_permissions" ADD CONSTRAINT "organisation_permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_permissions" ADD CONSTRAINT "organisation_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_role_permissions" ADD CONSTRAINT "organisation_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "organisation_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_role_permissions" ADD CONSTRAINT "organisation_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "organisation_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_role_permissions" ADD CONSTRAINT "organisation_role_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_user_roles" ADD CONSTRAINT "organisation_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "organisation_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_user_roles" ADD CONSTRAINT "organisation_user_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platfrom_audit_logs" ADD CONSTRAINT "platfrom_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
