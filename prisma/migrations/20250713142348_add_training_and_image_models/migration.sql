-- CreateTable
CREATE TABLE "training" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" TEXT,
    "replicateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingId" TEXT,
    "filename" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_replicateId_key" ON "training"("replicateId");

-- AddForeignKey
ALTER TABLE "training" ADD CONSTRAINT "training_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "training"("id") ON DELETE SET NULL ON UPDATE CASCADE;
