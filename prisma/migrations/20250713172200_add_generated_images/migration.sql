-- CreateTable
CREATE TABLE "generated_image" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "trainingId" TEXT,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_image_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "generated_image" ADD CONSTRAINT "generated_image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_image" ADD CONSTRAINT "generated_image_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "training_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
