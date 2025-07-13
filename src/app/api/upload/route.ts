import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import 'dotenv/config'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { auth } from '../../../../auth'
import { createTrainingRecord, createUploadedImageRecord, linkUploadedImagesToTraining } from '../../../lib/db'
import type { PutBlobResult } from '@vercel/blob'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session) {
          throw new Error('Unauthorized')
        }
        const { user } = session
        const userId = user.id

        return {
          allowedContentTypes: ['application/zip'],
          tokenPayload: JSON.stringify({
            userId,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }: { blob: PutBlobResult; tokenPayload?: string | null }) => {
        const { userId } = JSON.parse(tokenPayload ?? '{}')

        console.log('Blob upload completed, starting training for user:', userId)

        // Save the uploaded ZIP file as an uploaded image record
        await createUploadedImageRecord({
          userId,
          filename: blob.pathname.split('/').pop() || 'training-images.zip',
          blobUrl: blob.url,
          contentType: 'application/zip',
          size: 0, // Size not available from PutBlobResult
        })

        const training = await replicate.trainings.create(
          'stability-ai',
          'sdxl',
          '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
          {
            destination: `amazing-photos/${userId}`,
            input: {
              input_images: blob.url,
            },
            webhook: process.env.REPLICATE_WEBHOOK_URL,
          }
        )

        // Create training record with replicateId
        const trainingRecord = await createTrainingRecord({
          id: training.id,
          userId,
          status: training.status,
          replicateId: training.id,
        })

        // Link the uploaded ZIP to this training
        await linkUploadedImagesToTraining(userId, trainingRecord.id)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('An error occurred in upload handler:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
} 