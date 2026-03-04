/*
  Warnings:

  - A unique constraint covering the columns `[platform_role_id,platform_permission_id]` on the table `platform_role_permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "platform_role_permissions_platform_role_id_platform_permiss_key" ON "platform_role_permissions"("platform_role_id", "platform_permission_id");
