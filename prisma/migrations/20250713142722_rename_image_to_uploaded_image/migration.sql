/*
  Warnings:

  - You are about to drop the `image` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "image" DROP CONSTRAINT "image_trainingId_fkey";

-- DropForeignKey
ALTER TABLE "image" DROP CONSTRAINT "image_userId_fkey";

-- DropTable
DROP TABLE "image";

-- CreateTable
CREATE TABLE "uploaded_image" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingId" TEXT,
    "filename" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_image_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "uploaded_image" ADD CONSTRAINT "uploaded_image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_image" ADD CONSTRAINT "uploaded_image_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "training"("id") ON DELETE SET NULL ON UPDATE CASCADE;
