-- AlterTable
ALTER TABLE "uploaded_image" ADD COLUMN     "processingStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "uploadBatchId" TEXT;
