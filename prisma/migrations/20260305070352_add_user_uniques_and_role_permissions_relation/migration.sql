/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `organisation_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `platform_users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "organisation_users_user_id_key" ON "organisation_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_user_id_key" ON "platform_users"("user_id");
