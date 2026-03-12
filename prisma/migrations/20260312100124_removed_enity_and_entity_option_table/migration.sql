/*
  Warnings:

  - You are about to alter the column `action` on the `organisation_audit_logs` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the column `status_id` on the `organisation_users` table. All the data in the column will be lost.
  - The `status` column on the `organisations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `status_id` on the `platform_users` table. All the data in the column will be lost.
  - You are about to drop the `entities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `entity_options` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "entity_options" DROP CONSTRAINT "entity_options_entity_id_fkey";

-- DropForeignKey
ALTER TABLE "organisation_users" DROP CONSTRAINT "organisation_users_status_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_users" DROP CONSTRAINT "platform_users_status_id_fkey";

-- AlterTable
ALTER TABLE "organisation_audit_logs" ALTER COLUMN "action" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "organisation_users" DROP COLUMN "status_id",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "organisations" DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "platform_users" DROP COLUMN "status_id",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "entities";

-- DropTable
DROP TABLE "entity_options";
