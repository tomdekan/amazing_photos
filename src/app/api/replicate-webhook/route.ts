import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  prisma,
  updateTrainingRecord
} from "../../../lib/db";
import { sendTrainingCompletionEmail } from "../../../lib/email";
import { generateStarterImages } from "../../../lib/generateStarterImages";
import { GeneratedImage, TrainingRecord } from "../../../generated/prisma";

export async function POST(req: Request) {
	try {
		// Extract raw body for signature verification
		const rawBody = await req.text();

		// Verify webhook authenticity
		const isValid = await verifyReplicateWebhook(req, rawBody);
		if (!isValid) {
			console.error("❌ Webhook verification failed");
			return NextResponse.json(
				{ error: "Webhook verification failed" },
				{ status: 401 },
			);
		}

		console.info("✅ Webhook verification successful");

		// Parse body after verification
		const body = JSON.parse(rawBody);
		const { id, status, output } = body;
		console.info(`Received webhook for training ${id} with status ${status}`);

		if (!isTrainingSucceeded(status)) {
			await updateTrainingStatus(id, status);
			return NextResponse.json({ ok: true });
		}

		const trainingRecord = await getTrainingRecordWithUser(id);
		if (!trainingRecord) {
			return NextResponse.json(
				{ error: "Training record not found" },
				{ status: 404 },
			);
		}

		if (isAlreadyProcessed(trainingRecord.status)) {
			console.info("Training already marked as succeeded, skipping processing");
			return NextResponse.json({ ok: true });
		}

		const modelVersion = extractModelVersion(output);
		if (!modelVersion) {
			return NextResponse.json(
				{ error: "No model version found" },
				{ status: 400 },
			);
		}

		const generatedImages = await getOrGenerateImages(
			trainingRecord,
			modelVersion,
		);

		await updateTrainingStatus(id, "succeeded", modelVersion);
		await sendCompletionNotification(trainingRecord, generatedImages);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Error processing webhook:", error);
		return NextResponse.json(
			{ error: "Error processing webhook" },
			{ status: 500 },
		);
	}
}

async function verifyReplicateWebhook(
	req: Request,
	rawBody: string,
): Promise<boolean> {
	const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.error("❌ REPLICATE_WEBHOOK_SECRET not configured");
		return false;
	}

	// Extract required headers
	const webhookId = req.headers.get("webhook-id");
	const webhookTimestamp = req.headers.get("webhook-timestamp");
	const webhookSignature = req.headers.get("webhook-signature");

	if (!webhookId || !webhookTimestamp || !webhookSignature) {
		console.error("❌ Missing required webhook headers");
		return false;
	}

	// Verify timestamp to prevent replay attacks (within 5 minutes)
	const timestamp = parseInt(webhookTimestamp);
	const now = Math.floor(Date.now() / 1000);
	const tolerance = 300; // 5 minutes in seconds

	if (Math.abs(now - timestamp) > tolerance) {
		console.error("❌ Webhook timestamp outside tolerance window");
		return false;
	}

	// Construct signed content as per Replicate docs
	const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

	// Extract signing key (remove 'whsec_' prefix)
	const signingKey = webhookSecret.startsWith("whsec_")
		? webhookSecret.slice(6)
		: webhookSecret;

	// Calculate expected signature using HMAC SHA-256
	const expectedSignature = crypto
		.createHmac("sha256", Buffer.from(signingKey, "base64"))
		.update(signedContent, "utf8")
		.digest("base64");

	// Parse signatures from header (format: "v1,signature v1,signature2...")
	const signatures = webhookSignature.split(" ");

	// Check if any signature matches (using constant-time comparison)
	for (const sig of signatures) {
		// Remove version prefix (e.g., "v1,")
		const signature = sig.includes(",") ? sig.split(",")[1] : sig;

		if (constantTimeEquals(expectedSignature, signature)) {
			return true;
		}
	}

	console.error("❌ No matching webhook signatures found");
	return false;
}

function constantTimeEquals(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return result === 0;
}

function isTrainingSucceeded(status: string): boolean {
	return status === "succeeded";
}

async function updateTrainingStatus(
	replicateId: string,
	status: string,
	version?: string,
): Promise<void> {
	const updateData: { status: string; version?: string } = { status };
	if (version) {
		updateData.version = version;
	}
	await updateTrainingRecord(replicateId, updateData);
}

async function getTrainingRecordWithUser(replicateId: string) {
	const trainingRecord = await prisma.trainingRecord.findUnique({
		where: { replicateId },
		include: { user: true },
	});

	if (!trainingRecord) {
		console.error("Training record not found for id:", replicateId);
		return null;
	}

	return trainingRecord;
}

function isAlreadyProcessed(status: string): boolean {
	return status === "succeeded";
}

function extractModelVersion(output: any): string | null {
	const modelVersion = output?.version;
	if (!modelVersion) {
		console.error("No model version in output for succeeded training");
		return null;
	}
	return modelVersion;
}

async function getOrGenerateImages(
	trainingRecord: any,
	modelVersion: string,
): Promise<any[]> {
	console.info(
		"🎨 Training completed successfully! Checking for existing starter images...",
	);

	const existingImages = await prisma.generatedImage.findMany({
		where: { trainingId: trainingRecord.id },
	});

	if (existingImages.length > 0) {
		console.info(
			`📸 Found ${existingImages.length} existing starter images, skipping generation`,
		);
		return existingImages;
	}

	console.info("🎨 No existing images found, generating starter images...");

	const generatedImages = await generateStarterImages(
		trainingRecord.userId,
		trainingRecord.id,
		modelVersion,
		12,
		0,
	);

	console.info(
		`✅ Starter images generation completed with ${generatedImages.length} images`,
	);

	return generatedImages;
}

async function sendCompletionNotification(
	trainingRecord: TrainingRecord,
	generatedImages: GeneratedImage[],
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: {
      id: trainingRecord.userId,
    },
  });

	if (!user?.email) {
		console.error(
			"❌ Could not find user email for training completion notification",
		);
		return;
	}

	try {
		console.info(
			`📧 Preparing to send completion email with ${generatedImages.length} images`,
		);

		await sendTrainingCompletionEmail({
			userEmail: user.email,
			userName: user.name || user.email.split("@")[0],
			generatedImages: generatedImages,
			loginUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/generate`,
		});

		console.info("✅ Training completion email sent successfully");
	} catch (emailError) {
		console.error("❌ Failed to send training completion email:", emailError);
		// Don't fail the webhook if email fails
	}
}
