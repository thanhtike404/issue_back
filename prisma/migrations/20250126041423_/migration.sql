/*
  Warnings:

  - A unique constraint covering the columns `[issue_id]` on the table `issue_commands` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `issue_commands_issue_id_key` ON `issue_commands`(`issue_id`);
