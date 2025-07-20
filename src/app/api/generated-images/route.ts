import { type Prisma, PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const modelType = searchParams.get("modelType"); // 'pre-trained' or 'custom'
		const modelId = searchParams.get("modelId");

		// userId is required, but modelType and modelId are optional
		if (!userId) {
			return NextResponse.json(
				{ error: "Missing required parameter: userId" },
				{ status: 400 },
			);
		}

		// Ensure user can only access their own images
		if (userId !== session.user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const whereClause: Prisma.GeneratedImageWhereInput = {
			userId: userId,
		};

		// If modelType and modelId are provided, filter by them
		if (modelType && modelId) {
			if (modelType === "pre-trained") {
				// For pre-trained models, filter by modelVersion containing the model ID
				whereClause.modelVersion = {
					contains: modelId,
				};
				// Ensure it's not a custom model (has no trainingId)
				whereClause.trainingId = null;
			} else if (modelType === "custom") {
				// For custom models, filter by trainingId
				whereClause.trainingId = modelId;
			} else {
				return NextResponse.json(
					{ error: "Invalid model type" },
					{ status: 400 },
				);
			}
		}

		const images = await prisma.generatedImage.findMany({
			where: whereClause,
			orderBy: {
				createdAt: "desc",
			},
			take: 50, // Limit to most recent 50 images
		});

		return NextResponse.json({
			success: true,
			images,
		});
	} catch (error) {
		console.error("❌ Error fetching images:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch images",
				details: (error as Error).message,
			},
			{ status: 500 },
		);
	}
}
