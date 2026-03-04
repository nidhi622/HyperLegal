/*
  Warnings:

  - A unique constraint covering the columns `[organisation_id,user_id,organisation_role_id]` on the table `organisation_user_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "platform_permissions" ADD COLUMN     "created_by" UUID;

-- CreateIndex
CREATE INDEX "organisation_audit_logs_organisation_id_idx" ON "organisation_audit_logs"("organisation_id");

-- CreateIndex
CREATE INDEX "organisation_audit_logs_user_id_idx" ON "organisation_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "organisation_roles_organisation_id_idx" ON "organisation_roles"("organisation_id");

-- CreateIndex
CREATE INDEX "organisation_user_roles_organisation_id_idx" ON "organisation_user_roles"("organisation_id");

-- CreateIndex
CREATE INDEX "organisation_user_roles_user_id_idx" ON "organisation_user_roles"("user_id");

-- CreateIndex
CREATE INDEX "organisation_user_roles_organisation_role_id_idx" ON "organisation_user_roles"("organisation_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_user_roles_organisation_id_user_id_organisatio_key" ON "organisation_user_roles"("organisation_id", "user_id", "organisation_role_id");

-- CreateIndex
CREATE INDEX "organisation_users_organisation_id_idx" ON "organisation_users"("organisation_id");

-- CreateIndex
CREATE INDEX "organisation_users_user_id_idx" ON "organisation_users"("user_id");

-- CreateIndex
CREATE INDEX "platform_role_permissions_platform_role_id_idx" ON "platform_role_permissions"("platform_role_id");

-- CreateIndex
CREATE INDEX "platform_role_permissions_platform_permission_id_idx" ON "platform_role_permissions"("platform_permission_id");

-- CreateIndex
CREATE INDEX "platform_user_roles_user_id_idx" ON "platform_user_roles"("user_id");

-- CreateIndex
CREATE INDEX "platform_user_roles_platform_role_id_idx" ON "platform_user_roles"("platform_role_id");

-- CreateIndex
CREATE INDEX "platform_users_user_id_idx" ON "platform_users"("user_id");

-- AddForeignKey
ALTER TABLE "platform_permissions" ADD CONSTRAINT "platform_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_user_roles" ADD CONSTRAINT "organisation_user_roles_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
