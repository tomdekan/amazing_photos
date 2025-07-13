/*
  Warnings:

  - You are about to drop the `training` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "training" DROP CONSTRAINT "training_userId_fkey";

-- DropForeignKey
ALTER TABLE "uploaded_image" DROP CONSTRAINT "uploaded_image_trainingId_fkey";

-- DropTable
DROP TABLE "training";

-- CreateTable
CREATE TABLE "training_record" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" TEXT,
    "replicateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_record_replicateId_key" ON "training_record"("replicateId");

-- AddForeignKey
ALTER TABLE "training_record" ADD CONSTRAINT "training_record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_image" ADD CONSTRAINT "uploaded_image_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "training_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
