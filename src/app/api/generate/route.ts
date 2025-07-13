import Replicate from 'replicate'
import { getTrainingRecordByUser } from '../../../lib/db'
import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { headers } from 'next/headers'
import 'dotenv/config'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const { prompt } = await req.json()
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
  }

  const record = await getTrainingRecordByUser(userId)

  if (!record || record.status !== 'succeeded') {
    return NextResponse.json({ error: 'Model not ready yet' }, { status: 400 })
  }

  if (!record.version) {
    return NextResponse.json({ error: 'Model version not available' }, { status: 400 })
  }

  try {
    const modelOwner = 'amazing-photos' // as defined in train route destination
    const modelName = userId
    const modelVersion = record.version

    // The model string for fine-tuned models is `<owner>/<name>:<version>`
    const output = (await replicate.run(
      `${modelOwner}/${modelName}:${modelVersion}`,
      {
        input: { prompt },
      }
    )) as string[]
    const imageUrl = output[0]
    return NextResponse.json({ imageUrl })
  } catch (e) {
    console.error('Error generating image', e)
    return NextResponse.json({ error: 'Error generating image' }, { status: 500 })
  }
} 