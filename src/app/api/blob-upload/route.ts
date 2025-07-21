import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function POST(request: Request): Promise<NextResponse> {
	const body = (await request.json()) as HandleUploadBody;

	try {
		console.log("🐛 Debug - Starting blob upload process");
		const jsonResponse = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async (pathname, clientPayload) => {
				console.log("🐛 Debug - onBeforeGenerateToken called");
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session?.user?.id) {
					throw new Error("Unauthorized");
				}

				if (typeof clientPayload !== "string") {
					throw new Error("Invalid client payload: must be a string");
				}

				console.log("🐛 Debug - Raw clientPayload:", clientPayload);
				const { uploadBatchId, fileSize, trainingSessionId } =
					JSON.parse(clientPayload);
				console.log("🐛 Debug - Parsed payload:", {
					uploadBatchId,
					fileSize,
					trainingSessionId,
				});

				if (
					!uploadBatchId ||
					typeof fileSize !== "number" ||
					!trainingSessionId
				) {
					console.error("🐛 Debug - Missing required fields:", {
						hasUploadBatchId: !!uploadBatchId,
						hasFileSize: typeof fileSize === "number",
						hasTrainingSessionId: !!trainingSessionId,
					});
					throw new Error(
						"Invalid client payload content: must include uploadBatchId, fileSize, and trainingSessionId",
					);
				}

				return {
					addRandomSuffix: true,
					allowedContentTypes: [
						'image/jpeg',
						'image/png',
						'image/gif',
						'image/webp',
						'image/heic',
					],
				};
			},
			onUploadCompleted: async () => {
				// Database save is now handled separately in the frontend
				console.log('🐛 Debug - onUploadCompleted called (no-op)');
			},
		});

		console.log("🐛 Debug - handleUpload completed, returning response");
		return NextResponse.json(jsonResponse);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error.";
		console.error("🐛 Debug - Error in POST /api/blob-upload:", message);
		console.error("🐛 Debug - Full error:", error);
		return NextResponse.json(
			{ error: `Failed to handle upload: ${message}` },
			{ status: 400 },
		);
	}
}
