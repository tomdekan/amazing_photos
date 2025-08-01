import {
    type GeneratedImage,
    PrismaClient,
    type TrainingRecord,
    type UploadedImage,
} from "../generated/prisma";

const prisma = new PrismaClient();

export { prisma };

	export type { GeneratedImage, TrainingRecord } from "../generated/prisma";
export type UploadedImageRecord = UploadedImage;

export async function createTrainingRecord({
	id,
	userId,
	status,
	replicateId,
	sex,
}: {
	id: string;
	userId: string;
	status: string;
	replicateId: string;
	sex: string;
}): Promise<TrainingRecord> {
	return await prisma.trainingRecord.create({
		data: {
			id,
			userId,
			status,
			replicateId,
			sex,
		},
	});
}

export async function updateTrainingRecord(
	replicateId: string,
	newRecord: Partial<TrainingRecord>,
): Promise<TrainingRecord | null> {
	return await prisma.trainingRecord.update({
		where: { replicateId },
		data: newRecord,
	});
}

export async function getTrainingRecordByUser(
	userId: string,
): Promise<TrainingRecord | null> {
	return await prisma.trainingRecord.findFirst({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}

export async function getAllTrainingRecordsByUser(
	userId: string,
) {
	return await prisma.trainingRecord.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}

export async function createUploadedImageRecord({
	userId,
	trainingId,
	uploadBatchId,
	trainingSessionId,
	filename,
	blobUrl,
	contentType,
	size,
	processingStatus = "pending",
}: {
	userId: string;
	trainingId?: string;
	uploadBatchId?: string;
	trainingSessionId?: string;
	filename: string;
	blobUrl: string;
	contentType: string;
	size: number;
	processingStatus?: string;
}): Promise<UploadedImageRecord> {
	return await prisma.uploadedImage.create({
		data: {
			userId,
			trainingId,
			uploadBatchId,
			trainingSessionId,
			filename,
			blobUrl,
			contentType,
			size,
			processingStatus,
		},
	});
}

export async function getUploadedImagesByUser(
	userId: string,
): Promise<UploadedImageRecord[]> {
	return await prisma.uploadedImage.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}

export async function getUploadedImagesByTraining(
	trainingId: string,
): Promise<UploadedImageRecord[]> {
	return await prisma.uploadedImage.findMany({
		where: { trainingId },
		orderBy: { createdAt: "asc" },
	});
}

export async function getUploadedImagesByBatch(
	uploadBatchId: string,
): Promise<UploadedImageRecord[]> {
	return await prisma.uploadedImage.findMany({
		where: { uploadBatchId },
		orderBy: { createdAt: "asc" },
	});
}

export async function getUploadedImagesByTrainingSession(
	trainingSessionId: string,
): Promise<UploadedImageRecord[]> {
	return await prisma.uploadedImage.findMany({
		where: { trainingSessionId },
		orderBy: { createdAt: "asc" },
	});
}

export async function linkUploadedImagesToTraining(
	trainingSessionId: string,
	trainingId: string,
): Promise<void> {
	await prisma.uploadedImage.updateMany({
		where: {
			trainingSessionId,
			trainingId: null,
		},
		data: {
			trainingId,
		},
	});
}

export async function createGeneratedImageRecord({
	userId,
	prompt,
	imageUrl,
	originalUrl,
	trainingId,
	modelVersion,
}: {
	userId: string;
	prompt: string;
	imageUrl: string;
	originalUrl: string;
	trainingId?: string;
	modelVersion?: string;
}): Promise<GeneratedImage> {
	return await prisma.generatedImage.create({
		data: {
			userId,
			prompt,
			imageUrl,
			originalUrl,
			trainingId,
			modelVersion,
		},
	});
}

export async function getGeneratedImagesByUser(
	userId: string,
): Promise<GeneratedImage[]> {
	return await prisma.generatedImage.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		include: {
			training: true,
		},
	});
}
