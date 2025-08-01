import { PrismaClient } from "@/generated/prisma";
import { enhancePrompt } from "@/lib/promptHelper";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import Replicate from "replicate";
import { auth } from "../../../../../auth";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const prisma = new PrismaClient();

const PRE_TRAINED_MODEL_VERSIONS = {
	tom: "tomdekan/tom_dekan_1753034760868:2458284f6bd1dffd7d7dab8bdea6a65bed9883a20d5fa3cab573bdd2613cafc6",
};

const FREE_GENERATION_LIMIT = 30;

export async function POST(request: Request) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const user = await prisma.user.findUnique({ where: { id: userId } });

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Check if user has exceeded the free generation limit
		if (user.freeGenerationsUsed >= FREE_GENERATION_LIMIT) {
			return NextResponse.json(
				{ error: "You have used all your free generations." },
				{ status: 403 },
			);
		}

		const { prompt, model } = await request.json();

		if (!prompt || !model) {
			return NextResponse.json(
				{ error: "Prompt and model are required" },
				{ status: 400 },
			);
		}

		const enhancedPrompt = enhancePrompt(prompt, "male");

		const modelVersion =
			PRE_TRAINED_MODEL_VERSIONS[
				model as keyof typeof PRE_TRAINED_MODEL_VERSIONS
			];
		if (!modelVersion) {
			return NextResponse.json(
				{ error: "Invalid model selected" },
				{ status: 400 },
			);
		}

		console.info(
			`🎨 Generating free image for user: ${userId} with model: ${model}`,
		);

		// Generate image using the selected pre-trained model
		const output = await replicate.run(
			modelVersion as `${string}/${string}:${string}`,
			{
				input: {
					prompt: enhancedPrompt,
					num_outputs: 1,
					aspect_ratio: "1:1",
					output_format: "webp",
					output_quality: 90,
					disable_safety_checker: true,
				},
			},
		);

		const firstOutput = Array.isArray(output) ? output[0] : output;
		let imageUrl: string;

		if (
			firstOutput &&
			typeof firstOutput === "object" &&
			"url" in firstOutput
		) {
			const urlObject = firstOutput.url();
			imageUrl = urlObject.toString();
		} else if (typeof firstOutput === "string") {
			imageUrl = firstOutput;
		} else {
			console.error("❌ Unexpected output format:", firstOutput);
			throw new Error("Unexpected output format from model");
		}

		console.info("✅ Free image generated:", imageUrl);

		// Download and save the image to our blob storage
		console.info("💾 Saving free image to blob storage...");
		const imageResponse = await fetch(imageUrl);
		if (!imageResponse.ok) {
			throw new Error("Failed to download generated image");
		}

		const imageBuffer = await imageResponse.arrayBuffer();
		const filename = `free-generated-${Date.now()}-${userId}.webp`;

		const blob = await put(filename, imageBuffer, {
			access: "public",
			contentType: "image/webp",
		});

		console.info("✅ Free image saved to blob storage:", blob.url);

		// Save to database and increment free usage counter
		console.info("💾 Saving free image record to database...");
		const [generatedImage] = await prisma.$transaction([
			prisma.generatedImage.create({
				data: {
					userId,
					prompt: enhancedPrompt,
					imageUrl: blob.url,
					originalUrl: imageUrl,
					modelVersion: modelVersion,
				},
			}),
			prisma.user.update({
				where: { id: userId },
				data: { freeGenerationsUsed: { increment: 1 } },
			}),
		]);

		console.info("✅ Free generated image record created:", generatedImage.id);

		return NextResponse.json({
			success: true,
			imageUrl: blob.url,
		});
	} catch (error) {
		console.error("❌ Free generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate image",
				details: (error as Error).message,
			},
			{ status: 500 },
		);
	}
}
