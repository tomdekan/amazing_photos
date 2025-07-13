/*
  Warnings:

  - You are about to drop the column `loraType` on the `training_record` table. All the data in the column will be lost.
  - You are about to drop the column `triggerWord` on the `training_record` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "training_record" DROP COLUMN "loraType",
DROP COLUMN "triggerWord";
