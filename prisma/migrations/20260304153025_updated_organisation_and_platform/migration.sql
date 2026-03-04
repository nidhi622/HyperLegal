/*
  Warnings:

  - You are about to drop the column `primary_email` on the `organisations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `organisations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `organisations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organisations" DROP COLUMN "primary_email",
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "email" VARCHAR(255) NOT NULL,
ADD COLUMN     "red_flag_policies" JSONB;

-- AlterTable
ALTER TABLE "platform_users" ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "organisations_email_key" ON "organisations"("email");
