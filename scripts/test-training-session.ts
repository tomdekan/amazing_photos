#!/usr/bin/env tsx

/**
 * Test script for training session ID functionality
 * This script tests that images uploaded with different training session IDs
 * are properly isolated and only the correct images are used for training.
 */

import { put } from "@vercel/blob";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

// Test configuration
const TEST_USER_ID = "test-user-" + Date.now();
const TRAINING_SESSION_1 = "session-1-" + Date.now();
const TRAINING_SESSION_2 = "session-2-" + Date.now();
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// Mock image data (small test images)
const createMockImageBuffer = (name: string): Buffer => {
	// Create a minimal valid image buffer (1x1 pixel PNG)
	const pngHeader = Buffer.from([
		0x89,
		0x50,
		0x4e,
		0x47,
		0x0d,
		0x0a,
		0x1a,
		0x0a, // PNG signature
		0x00,
		0x00,
		0x00,
		0x0d, // IHDR chunk length
		0x49,
		0x48,
		0x44,
		0x52, // IHDR
		0x00,
		0x00,
		0x00,
		0x01, // width: 1
		0x00,
		0x00,
		0x00,
		0x01, // height: 1
		0x08,
		0x02,
		0x00,
		0x00,
		0x00, // bit depth, color type, compression, filter, interlace
		0x90,
		0x77,
		0x53,
		0xde, // CRC
		0x00,
		0x00,
		0x00,
		0x0c, // IDAT chunk length
		0x49,
		0x44,
		0x41,
		0x54, // IDAT
		0x08,
		0x99,
		0x01,
		0x01,
		0x00,
		0x00,
		0x00,
		0xff,
		0xff,
		0x00,
		0x00,
		0x00,
		0x02,
		0x00,
		0x01, // image data
		0xe2,
		0x21,
		0xbc,
		0x33, // CRC
		0x00,
		0x00,
		0x00,
		0x00, // IEND chunk length
		0x49,
		0x45,
		0x4e,
		0x44, // IEND
		0xae,
		0x42,
		0x60,
		0x82, // CRC
	]);
	return pngHeader;
};

async function uploadTestImage(
	trainingSessionId: string,
	filename: string,
	uploadBatchId: string,
): Promise<string> {
	console.log(
		`📤 Uploading test image: ${filename} for session: ${trainingSessionId}`,
	);

	// Create mock image buffer
	const imageBuffer = createMockImageBuffer(filename);

	// Upload to blob storage
	const blob = await put(`test-${filename}`, imageBuffer, {
		access: "public",
		contentType: "image/png",
		addRandomSuffix: true,
	});

	// Create database record directly (simulating the blob-upload API)
	const imageRecord = await prisma.uploadedImage.create({
		data: {
			userId: TEST_USER_ID,
			trainingSessionId,
			uploadBatchId,
			filename,
			blobUrl: blob.url,
			contentType: "image/png",
			size: imageBuffer.length,
			processingStatus: "uploaded",
		},
	});

	console.log(`✅ Uploaded ${filename} - Record ID: ${imageRecord.id}`);
	return imageRecord.id;
}

async function testTrainingSessionIsolation() {
	console.log("🧪 Testing Training Session Isolation");
	console.log("=====================================\n");

	try {
		// Clean up any existing test data
		await prisma.uploadedImage.deleteMany({
			where: { userId: TEST_USER_ID },
		});
		await prisma.user.deleteMany({
			where: { id: TEST_USER_ID },
		});

		// Create test user
		console.log("👤 Creating test user...");
		await prisma.user.create({
			data: {
				id: TEST_USER_ID,
				name: "Test User",
				email: `test-${Date.now()}@example.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		console.log("✅ Test user created\n");

		// Step 1: Upload images to two different training sessions
		console.log("📂 Step 1: Uploading images to different sessions\n");

		const session1Images = [];
		const session2Images = [];

		// Upload 3 images to session 1
		for (let i = 1; i <= 3; i++) {
			const imageId = await uploadTestImage(
				TRAINING_SESSION_1,
				`session1-image${i}.png`,
				`batch1-${i}`,
			);
			session1Images.push(imageId);
		}

		// Upload 2 images to session 2
		for (let i = 1; i <= 2; i++) {
			const imageId = await uploadTestImage(
				TRAINING_SESSION_2,
				`session2-image${i}.png`,
				`batch2-${i}`,
			);
			session2Images.push(imageId);
		}

		console.log(`\n📊 Session 1 has ${session1Images.length} images`);
		console.log(`📊 Session 2 has ${session2Images.length} images\n`);

		// Step 2: Test getting images by training session
		console.log("🔍 Step 2: Testing image retrieval by session\n");

		const { getUploadedImagesByTrainingSession } = await import(
			"../src/lib/db"
		);

		const session1Results =
			await getUploadedImagesByTrainingSession(TRAINING_SESSION_1);
		const session2Results =
			await getUploadedImagesByTrainingSession(TRAINING_SESSION_2);

		console.log(`🎯 Retrieved ${session1Results.length} images for session 1`);
		console.log(`🎯 Retrieved ${session2Results.length} images for session 2`);

		// Verify isolation
		if (session1Results.length !== 3) {
			throw new Error(
				`Expected 3 images for session 1, got ${session1Results.length}`,
			);
		}

		if (session2Results.length !== 2) {
			throw new Error(
				`Expected 2 images for session 2, got ${session2Results.length}`,
			);
		}

		// Verify correct sessions
		const session1HasCorrectSession = session1Results.every(
			(img) => img.trainingSessionId === TRAINING_SESSION_1,
		);
		const session2HasCorrectSession = session2Results.every(
			(img) => img.trainingSessionId === TRAINING_SESSION_2,
		);

		if (!session1HasCorrectSession) {
			throw new Error("Session 1 results contain images from other sessions");
		}

		if (!session2HasCorrectSession) {
			throw new Error("Session 2 results contain images from other sessions");
		}

		console.log("✅ Session isolation test passed!\n");

		// Step 3: Test training linkage
		console.log("🔗 Step 3: Testing training linkage\n");

		const { linkUploadedImagesToTraining } = await import("../src/lib/db");

		const mockTrainingId1 = "training-1-" + Date.now();
		const mockTrainingId2 = "training-2-" + Date.now();

		// Create mock training records
		console.log("🏗️ Creating mock training records...");
		await prisma.trainingRecord.create({
			data: {
				id: mockTrainingId1,
				userId: TEST_USER_ID,
				status: "succeeded",
				replicateId: `replicate-${mockTrainingId1}`,
				sex: "male",
			},
		});

		await prisma.trainingRecord.create({
			data: {
				id: mockTrainingId2,
				userId: TEST_USER_ID,
				status: "succeeded",
				replicateId: `replicate-${mockTrainingId2}`,
				sex: "female",
			},
		});
		console.log("✅ Mock training records created\n");

		// Link session 1 images to training 1
		await linkUploadedImagesToTraining(TRAINING_SESSION_1, mockTrainingId1);
		console.log(`🔗 Linked session 1 images to training: ${mockTrainingId1}`);

		// Link session 2 images to training 2
		await linkUploadedImagesToTraining(TRAINING_SESSION_2, mockTrainingId2);
		console.log(`🔗 Linked session 2 images to training: ${mockTrainingId2}`);

		// Verify linkage
		const linkedImages1 = await prisma.uploadedImage.findMany({
			where: { trainingId: mockTrainingId1 },
		});

		const linkedImages2 = await prisma.uploadedImage.findMany({
			where: { trainingId: mockTrainingId2 },
		});

		if (linkedImages1.length !== 3) {
			throw new Error(
				`Expected 3 linked images for training 1, got ${linkedImages1.length}`,
			);
		}

		if (linkedImages2.length !== 2) {
			throw new Error(
				`Expected 2 linked images for training 2, got ${linkedImages2.length}`,
			);
		}

		console.log("✅ Training linkage test passed!\n");

		// Step 4: Test cross-contamination prevention
		console.log("🛡️ Step 4: Testing cross-contamination prevention\n");

		// Try to get images for a non-existent session
		const nonExistentResults = await getUploadedImagesByTrainingSession(
			"non-existent-session",
		);

		if (nonExistentResults.length !== 0) {
			throw new Error(
				`Expected 0 images for non-existent session, got ${nonExistentResults.length}`,
			);
		}

		console.log("✅ Cross-contamination prevention test passed!\n");

		// Step 5: Test that images with no trainingSessionId are isolated
		console.log("🔒 Step 5: Testing legacy image isolation\n");

		// Create an image without trainingSessionId (legacy)
		await prisma.uploadedImage.create({
			data: {
				userId: TEST_USER_ID,
				trainingSessionId: null,
				uploadBatchId: "legacy-batch",
				filename: "legacy-image.png",
				blobUrl: "https://example.com/legacy.png",
				contentType: "image/png",
				size: 1000,
				processingStatus: "uploaded",
			},
		});

		// Verify it doesn't appear in our session results
		const session1AfterLegacy =
			await getUploadedImagesByTrainingSession(TRAINING_SESSION_1);
		const session2AfterLegacy =
			await getUploadedImagesByTrainingSession(TRAINING_SESSION_2);

		if (session1AfterLegacy.length !== 3 || session2AfterLegacy.length !== 2) {
			throw new Error("Legacy image contaminated session results");
		}

		console.log("✅ Legacy image isolation test passed!\n");

		console.log("🎉 ALL TESTS PASSED! 🎉");
		console.log("======================");
		console.log("✅ Session isolation works correctly");
		console.log("✅ Training linkage works correctly");
		console.log("✅ Cross-contamination is prevented");
		console.log("✅ Legacy images are properly isolated");
	} catch (error) {
		console.error("❌ TEST FAILED:", error);
		throw error;
	} finally {
		// Clean up test data
		console.log("\n🧹 Cleaning up test data...");
		await prisma.uploadedImage.deleteMany({
			where: { userId: TEST_USER_ID },
		});
		await prisma.trainingRecord.deleteMany({
			where: { userId: TEST_USER_ID },
		});
		await prisma.user.deleteMany({
			where: { id: TEST_USER_ID },
		});
		await prisma.$disconnect();
		console.log("✅ Cleanup complete");
	}
}

// Run the test
if (require.main === module) {
	testTrainingSessionIsolation()
		.then(() => {
			console.log("\n✨ Test script completed successfully!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n💥 Test script failed:", error);
			process.exit(1);
		});
}

export { testTrainingSessionIsolation };
