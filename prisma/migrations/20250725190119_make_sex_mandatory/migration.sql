/*
  Warnings:

  - Made the column `sex` on table `training_record` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "training_record" ALTER COLUMN "sex" SET NOT NULL;
