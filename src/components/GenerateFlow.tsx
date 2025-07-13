'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { upload } from '@vercel/blob/client'
import Image from 'next/image'
import { type TrainingRecord } from '../lib/db'

type User = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export function GenerateFlow({
  user,
  trainingRecord: initialTrainingRecord,
}: {
  user: User
  trainingRecord: TrainingRecord | null
}) {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState('')
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [trainingRecord, setTrainingRecord] = useState(initialTrainingRecord)

  async function handleUploadAndTrain() {
    if (files.length === 0) {
      setStatus('Please select at least one image.')
      return
    }
    if (files.length < 1 || files.length > 20) { // TODO: Add a limit here.
      setStatus('Please select between 5 and 20 images.')
      return
    }

    setLoading(true)
    setStatus('Zipping files...')

    const zip = new JSZip()
    files.forEach(file => {
      zip.file(file.name, file)
    })
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const zipFile = new File([zipBlob], 'training-images.zip', {
      type: 'application/zip',
    })

    try {
      setStatus('Uploading and starting training...')
      await upload(zipFile.name, zipFile, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })

      setStatus(
        `Training kicked off. Check back in ~20 mins. ✨`
      )
      // Optimistically update UI - the server will create the real record
      setTrainingRecord({ 
        id: 'temp-id', 
        userId: user.id, 
        status: 'starting',
        version: null,
        replicateId: 'temp-replicate-id',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error(error)
      setStatus('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    setLoading(true)
    setImageUrl('')
    try {
      const { imageUrl, error } = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }).then(r => r.json())

      if (error) {
        alert(error)
      } else {
        setImageUrl(imageUrl)
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred while generating the image.')
    } finally {
      setLoading(false)
    }
  }

  const isTrainingComplete = trainingRecord?.status === 'succeeded'
  const isTrainingRunning =
    trainingRecord &&
    ['starting', 'processing'].includes(trainingRecord.status)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">1. Train Your Model</h2>
        <p className="text-gray-500">
          Upload 10-20 pictures of yourself (The more the better)
        </p>
        {isTrainingComplete && (
          <div className="p-4 mt-4 text-green-700 bg-green-100 border border-green-400 rounded-md">
            <p className="font-bold">Training complete!</p>
            <p>You can now generate images with your model.</p>
          </div>
        )}
        {isTrainingRunning && (
          <div className="p-4 mt-4 text-blue-700 bg-blue-100 border border-blue-400 rounded-md">
            <p className="font-bold">Training in progress...</p>
            <p>This can take up to 20 minutes. You can leave this page and come back later.</p>
          </div>
        )}
        {!isTrainingComplete && !isTrainingRunning && (
          <div className="flex flex-col gap-4 mt-4 max-w-sm">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e =>
                setFiles(e.target.files ? Array.from(e.target.files) : [])
              }
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
            <button
              onClick={handleUploadAndTrain}
              disabled={files.length === 0 || loading}
              className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-md disabled:bg-gray-400 hover:bg-blue-600"
            >
              {loading ? 'Working...' : 'Upload & Train'}
            </button>
            {status && <p className="text-sm text-gray-600">{status}</p>}
          </div>
        )}
      </div>

      {isTrainingComplete && (
        <div>
          <h2 className="text-xl font-semibold">2. Generate Images</h2>
          <p className="text-gray-500">
            Enter a prompt to generate a new image of you.
          </p>
          <div className="flex flex-col gap-4 mt-4 max-w-sm">
            <textarea
              placeholder="A photo of me as an astronaut..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt || loading}
              className="px-4 py-2 font-semibold text-white bg-green-500 rounded-md disabled:bg-gray-400 hover:bg-green-600"
            >
              {loading ? 'Generating…' : 'Generate'}
            </button>
          </div>

          {imageUrl && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Result:</h3>
              <Image
                width={300}
                height={300}
                src={imageUrl}
                alt="Generated image"
                className="mt-2 border-4 border-gray-200 rounded-lg shadow-md"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
} 