import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request): Promise<NextResponse> {
	const body = (await request.json()) as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async (pathname, clientPayload) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session?.user?.id) {
					throw new Error('Unauthorized');
				}

				if (typeof clientPayload !== 'string') {
					throw new Error('Invalid client payload: must be a string');
				}

				const { uploadBatchId, fileSize } = JSON.parse(clientPayload);
				if (!uploadBatchId || typeof fileSize !== 'number') {
					throw new Error(
						'Invalid client payload content: must include uploadBatchId and fileSize',
					);
				}

				return {
					allowedContentTypes: [
						'image/jpeg',
						'image/png',
						'image/gif',
						'image/webp',
						'image/heic',
					],
					tokenPayload: JSON.stringify({
						userId: session.user.id,
						uploadBatchId,
						fileSize,
					}),
				};
			},
			onUploadCompleted: async ({ blob, tokenPayload }) => {
				if (process.env.NODE_ENV !== 'production') {
					console.log('Client blob upload completed', {
						pathname: blob.pathname,
						url: blob.url,
					});
				}

				try {
					const { userId, uploadBatchId, fileSize } = JSON.parse(
						tokenPayload || '{}',
					);

					if (!userId || !uploadBatchId || typeof fileSize !== 'number') {
						throw new Error(
							'User ID, upload batch ID, or file size not found in token payload',
						);
					}

					await prisma.uploadedImage.create({
						data: {
							userId,
							uploadBatchId,
							filename: blob.pathname,
							blobUrl: blob.url,
							contentType: blob.contentType,
							size: fileSize,
							processingStatus: 'uploaded',
						},
					});
				} catch (error) {
					console.error('Error in onUploadCompleted:', error);
					throw new Error('Could not update database after upload.');
				}
			},
		});

		return NextResponse.json(jsonResponse);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error.';
		console.error('Error in POST /api/blob-upload:', message);
		return NextResponse.json(
			{ error: `Failed to handle upload: ${message}` },
			{ status: 400 },
		);
	}
} 