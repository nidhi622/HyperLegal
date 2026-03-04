/*
  Warnings:

  - A unique constraint covering the columns `[user_id,platform_role_id]` on the table `platform_user_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "platform_user_roles_user_id_platform_role_id_key" ON "platform_user_roles"("user_id", "platform_role_id");
