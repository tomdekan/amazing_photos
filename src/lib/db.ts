import { PrismaClient, type Training, type UploadedImage } from '../generated/prisma'

const prisma = new PrismaClient()

export type TrainingRecord = Training
export type UploadedImageRecord = UploadedImage

// Create a new training record
export async function createTrainingRecord({
  id,
  userId,
  status,
  replicateId,
}: {
  id: string
  userId: string
  status: string
  replicateId: string
}): Promise<TrainingRecord> {
  return await prisma.training.create({
    data: {
      id,
      userId,
      status,
      replicateId,
    },
  })
}

// Update training record from webhook
export async function updateTrainingRecord(
  replicateId: string,
  newRecord: Partial<TrainingRecord>
): Promise<TrainingRecord | null> {
  return await prisma.training.update({
    where: { replicateId },
    data: newRecord,
  })
}

// Find latest training for a user
export async function getTrainingRecordByUser(
  userId: string
): Promise<TrainingRecord | null> {
  return await prisma.training.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

// Create an uploaded image record
export async function createUploadedImageRecord({
  userId,
  trainingId,
  filename,
  blobUrl,
  contentType,
  size,
}: {
  userId: string
  trainingId?: string
  filename: string
  blobUrl: string
  contentType: string
  size: number
}): Promise<UploadedImageRecord> {
  return await prisma.uploadedImage.create({
    data: {
      userId,
      trainingId,
      filename,
      blobUrl,
      contentType,
      size,
    },
  })
}

// Get uploaded images for a user
export async function getUploadedImagesByUser(userId: string): Promise<UploadedImageRecord[]> {
  return await prisma.uploadedImage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

// Get uploaded images for a training
export async function getUploadedImagesByTraining(
  trainingId: string
): Promise<UploadedImageRecord[]> {
  return await prisma.uploadedImage.findMany({
    where: { trainingId },
    orderBy: { createdAt: 'asc' },
  })
}

// Associate uploaded images with a training
export async function linkUploadedImagesToTraining(
  userId: string,
  trainingId: string
): Promise<void> {
  await prisma.uploadedImage.updateMany({
    where: {
      userId,
      trainingId: null,
    },
    data: {
      trainingId,
    },
  })
} 