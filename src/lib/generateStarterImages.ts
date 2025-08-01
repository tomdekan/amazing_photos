import { put } from "@vercel/blob";
import Replicate from "replicate";
import type { GeneratedImage } from "../generated/prisma";
import { createGeneratedImageRecord, prisma } from "./db";
import { getStarterPrompts } from "./starter-prompts";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function generateImagesFromPromptStrings(
	userId: string,
	trainingRecordId: string,
	modelVersion: string,
	prompts: string[],
): Promise<GeneratedImage[]> {
	// Store generated images to return them
	const generatedImages: GeneratedImage[] = [];

	// Generate images in smaller batches to avoid overwhelming the system
	const BATCH_SIZE = 3;

	for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
		const batchPrompts = prompts.slice(i, i + BATCH_SIZE);
		console.log(
			`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(prompts.length / BATCH_SIZE)}`,
		);

		// Process batch in parallel
		const batchPromises = batchPrompts.map(async (prompt, index) => {
			try {
				console.log(
					`🎯 Generating image ${i + index + 1}/${prompts.length}: "${prompt.substring(0, 50)}..."`,
				);

				// Generate image using the trained model
				const output = await replicate.run(
					modelVersion as `${string}/${string}:${string}`,
					{
						input: {
							prompt: prompt,
							num_outputs: 1,
							aspect_ratio: "1:1",
							output_format: "webp",
							output_quality: 90,
							disable_safety_checker: true,
						},
					},
				);

				// Extract the image URL from the output
				let imageUrl: string;
				const firstOutput = Array.isArray(output) ? output[0] : output;

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
					throw new Error("Unexpected output format from model");
				}

				// Download and save the image to our blob storage
				const imageResponse = await fetch(imageUrl);
				if (!imageResponse.ok) {
					throw new Error("Failed to download generated image");
				}

				const imageBuffer = await imageResponse.arrayBuffer();
				const filename = `starter-${Date.now()}-${userId}-${i + index + 1}.webp`;

				const blob = await put(filename, imageBuffer, {
					access: "public",
					contentType: "image/webp",
				});

				const savedImage = await createGeneratedImageRecord({
					userId,
					prompt,
					imageUrl: blob.url,
					originalUrl: imageUrl,
					trainingId: trainingRecordId,
					modelVersion,
				});

				// Add to our results array
				generatedImages.push(savedImage);

				console.log(`✅ Starter image ${i + index + 1} generated and saved`);
			} catch (error) {
				console.error(
					`❌ Failed to generate starter image ${i + index + 1}:`,
					error,
				);
				// Continue with other images even if one fails
			}
		});

		// Wait for current batch to complete before starting next batch
		await Promise.all(batchPromises);

		// Small delay between batches to be respectful to the API
		if (i + BATCH_SIZE < prompts.length) {
			console.log("⏳ Waiting 2 seconds before next batch...");
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}

	console.log("🎉 Batch generation of starter images completed!");
	return generatedImages;
}


export async function generateStarterImages(
	userId: string,
	trainingRecordId: string,
	modelVersion: string,
	numberOfImages: number,
	startingFrom: number,
): Promise<GeneratedImage[]> {
	console.log(
		"🎨 Starting batch generation of starter images for user:",
		userId,
	);

	const trainingRecord = await prisma.trainingRecord.findUnique({
		where: { id: trainingRecordId },
		select: { sex: true },
	});
	if (!trainingRecord?.sex) {
		throw new Error("Training record has no sex");
	}

	const promptObjects = await getStarterPrompts(
		trainingRecord.sex,
		numberOfImages,
		startingFrom,
	);
	console.log(
		`📝 Generating ${promptObjects.length} starter images for ${trainingRecord.sex}...`,
	);

	const prompts = promptObjects.map(p => p.prompt);

	return generateImagesFromPromptStrings(userId, trainingRecordId, modelVersion, prompts);
}
