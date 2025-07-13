'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { type TrainingRecord } from '../lib/db'

type User = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

type UploadingImage = {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'saving' | 'completed' | 'error'
  progress: number
  blobUrl?: string
  error?: string
}

type DatabaseImage = {
  id: string
  filename: string
  blobUrl: string
  uploadBatchId: string | null
  processingStatus: string
  createdAt: string
}

type GeneratedImage = {
  id: string
  userId: string
  prompt: string
  imageUrl: string
  originalUrl: string
  trainingId: string | null
  modelVersion: string | null
  createdAt: string
  training?: {
    id: string
    status: string
  } | null
}

// Generate a simple UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function GenerateFlow({
  user,
  trainingRecord: initialTrainingRecord,
}: {
  user: User
  trainingRecord: TrainingRecord | null
}) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([])
  const [databaseImages, setDatabaseImages] = useState<DatabaseImage[]>([])
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [status, setStatus] = useState('')
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [trainingRecord, setTrainingRecord] = useState(initialTrainingRecord)
  const [uploadBatchId, setUploadBatchId] = useState<string>('')
  const [trainingLoading, setTrainingLoading] = useState(false)

  // Fetch uploaded images from database on component mount
  useEffect(() => {
    // Generate batch ID only on client side to avoid hydration mismatch
    setUploadBatchId(generateUUID())
    fetchDatabaseImages()
    fetchGeneratedImages()
  }, [])

  // Poll training status if training is in progress
  useEffect(() => {
    if (!trainingRecord || trainingRecord.status === 'succeeded' || trainingRecord.status === 'failed') {
      return
    }

    const pollTrainingStatus = async () => {
      try {
        const response = await fetch('/api/check-training')
        const data = await response.json()
        
        if (data.success && data.statusChanged) {
          console.log('📊 Training status updated:', data.training.status)
          setTrainingRecord(data.training)
          
          if (data.training.status === 'succeeded') {
            setStatus('🎉 Training completed successfully! You can now generate images.')
          } else if (data.training.status === 'failed') {
            setStatus('❌ Training failed. Please try again.')
          }
        }
      } catch (error) {
        console.error('❌ Error polling training status:', error)
      }
    }

    // Poll every 30 seconds if training is in progress
    const interval = setInterval(pollTrainingStatus, 30000)
    
    // Also check immediately
    pollTrainingStatus()

    return () => clearInterval(interval)
  }, [trainingRecord?.status])

  async function fetchDatabaseImages() {
    try {
      const response = await fetch('/api/debug-images')
      const data = await response.json()
      if (data.success) {
        setDatabaseImages(data.images)
        console.log('📊 Database images:', data)
      } else {
        console.error('Failed to fetch database images:', data.error)
      }
    } catch (error) {
      console.error('Error fetching database images:', error)
    }
  }

  async function fetchGeneratedImages() {
    try {
      const response = await fetch('/api/generated-images')
      const data = await response.json()
      if (data.success) {
        setGeneratedImages(data.images)
        console.log('📊 Generated images:', data)
      } else {
        console.error('Failed to fetch generated images:', data.error)
      }
    } catch (error) {
      console.error('Error fetching generated images:', error)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : []
    setFiles(selectedFiles)
    
    // Create preview objects for each file
    const previews = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      progress: 0,
    }))
    setUploadingImages(previews)
  }

  async function saveImageToDatabase(filename: string, blobUrl: string, contentType: string, size: number) {
    try {
      const response = await fetch('/api/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          blobUrl,
          contentType,
          size,
          uploadBatchId,
        }),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to save to database')
      }

      console.log('✅ Saved to database:', data.imageId)
      return data.imageId
    } catch (error) {
      console.error('❌ Database save error:', error)
      throw error
    }
  }

  async function startTraining() {
    setTrainingLoading(true)
    try {
      console.log('🚀 Starting training with hardcoded settings')
      
      const response = await fetch('/api/start-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start training')
      }

      console.log('✅ Training started:', data.trainingId)
      setStatus(`Training started successfully! Training ID: ${data.trainingId}`)
      
      // Update training record state
      setTrainingRecord({
        id: data.trainingId,
        userId: user.id,
        status: data.status,
        version: null,
        replicateId: data.trainingId,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
    } catch (error) {
      console.error('❌ Training start error:', error)
      setStatus(`Failed to start training: ${(error as Error).message}`)
    } finally {
      setTrainingLoading(false)
    }
  }

  async function handleUploadAndTrain() {
    if (files.length === 0) {
      setStatus('Please select at least one image.')
      return
    }
    if (files.length < 1 || files.length > 20) {
      setStatus('Please select between 5 and 20 images.')
      return
    }

    setLoading(true)
    console.log('🚀 Starting upload with', files.length, 'files')

    try {
      setStatus('Uploading images...')
      
      // Upload each file individually with progress tracking
      const uploadedBlobs = []
      for (let i = 0; i < uploadingImages.length; i++) {
        const imageData = uploadingImages[i]
        
        try {
          // Step 1: Upload to Vercel Blob
          setUploadingImages(prev => prev.map((img, idx) => 
            idx === i ? { ...img, status: 'uploading', progress: 0 } : img
          ))
          
          console.log('📤 Uploading to blob:', imageData.file.name, imageData.file.size, 'bytes')
          
          // Simulate progress for upload
          const progressInterval = setInterval(() => {
            setUploadingImages(prev => prev.map((img, idx) => 
              idx === i && img.status === 'uploading' 
                ? { ...img, progress: Math.min(img.progress + Math.random() * 30, 80) }
                : img
            ))
          }, 200)
          
          // Upload to our server which will handle blob upload
          const response = await fetch(`/api/blob-upload?filename=${encodeURIComponent(imageData.file.name)}`, {
            method: 'POST',
            body: imageData.file,
          })
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`)
          }
          
          const blob = await response.json()
          
          clearInterval(progressInterval)
          console.log('✅ Blob uploaded:', blob.url)
          
          // Step 2: Save to database
          setUploadingImages(prev => prev.map((img, idx) => 
            idx === i ? { ...img, status: 'saving', progress: 85 } : img
          ))
          
          await saveImageToDatabase(
            imageData.file.name,
            blob.url,
            imageData.file.type,
            imageData.file.size
          )
          
          // Step 3: Mark as completed
          setUploadingImages(prev => prev.map((img, idx) => 
            idx === i ? { 
              ...img, 
              status: 'completed', 
              progress: 100, 
              blobUrl: blob.url 
            } : img
          ))
          
          uploadedBlobs.push(blob)
          
        } catch (error) {
          console.error('❌ Upload error for', imageData.file.name, error)
          setUploadingImages(prev => prev.map((img, idx) => 
            idx === i ? { 
              ...img, 
              status: 'error', 
              error: (error as Error).message 
            } : img
          ))
        }
      }

      setStatus(`Successfully uploaded ${uploadedBlobs.length} images to database! 🎉`)
      
      // Refresh database images after upload
      setTimeout(() => {
        fetchDatabaseImages()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Upload error:', error)
      setStatus(`An error occurred: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    setLoading(true)
    setImageUrl('')
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      
      const data = await response.json()

      if (data.error) {
        alert(data.error)
      } else {
        setImageUrl(data.imageUrl)
        // Refresh generated images list
        fetchGeneratedImages()
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred while generating the image.')
    } finally {
      setLoading(false)
    }
  }

  function removeImage(index: number) {
    const newFiles = files.filter((_, i) => i !== index)
    const newUploading = uploadingImages.filter((_, i) => i !== index)
    setFiles(newFiles)
    setUploadingImages(newUploading)
    
    // Cleanup preview URL
    if (uploadingImages[index]) {
      URL.revokeObjectURL(uploadingImages[index].preview)
    }
  }

  const isTrainingComplete = trainingRecord?.status === 'succeeded'
  const isTrainingRunning =
    trainingRecord &&
    ['starting', 'processing'].includes(trainingRecord.status)

  return (
    <div className="space-y-8">
      {/* Debug Section */}
      <div className="p-4 bg-gray-50 border rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Database Status</h3>
          <button
            onClick={fetchDatabaseImages}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
        <p className="text-xs text-gray-600">
          Images in database: {databaseImages.length} | Batch ID: {uploadBatchId ? uploadBatchId.slice(0, 8) + '...' : 'Loading...'} | User: {user.name}
        </p>
        {databaseImages.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {databaseImages.slice(0, 4).map((img) => (
              <div key={img.id} className="relative aspect-square">
                <Image
                  src={img.blobUrl}
                  alt={img.filename}
                  fill
                  className="object-cover rounded border"
                />
              </div>
            ))}
          </div>
        )}
      </div>

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
          <div className="mt-4">
            {/* File Input */}
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB each)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Image Preview Grid */}
            {uploadingImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">
                  Selected Images ({uploadingImages.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {uploadingImages.map((imageData, index) => (
                    <div key={index} className="relative group">
                      {/* Image Container */}
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm border">
                        <Image
                          src={imageData.preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        
                        {/* Status Overlay */}
                        {imageData.status !== 'pending' && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            {(imageData.status === 'uploading' || imageData.status === 'saving') && (
                              <div className="text-center text-white">
                                <div className="w-8 h-8 mx-auto mb-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <div className="text-xs">{Math.round(imageData.progress)}%</div>
                                <div className="text-xs">{imageData.status === 'saving' ? 'Saving...' : 'Uploading...'}</div>
                              </div>
                            )}
                            {imageData.status === 'completed' && (
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            {imageData.status === 'error' && (
                              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Remove Button */}
                        {imageData.status === 'pending' && (
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* File Name */}
                      <p className="mt-1 text-xs text-gray-500 truncate">
                        {imageData.file.name}
                      </p>
                      
                      {/* Error Message */}
                      {imageData.status === 'error' && (
                        <p className="mt-1 text-xs text-red-500 truncate">
                          {imageData.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUploadAndTrain}
              disabled={files.length === 0 || loading}
              className="px-6 py-3 font-semibold text-white bg-blue-500 rounded-lg disabled:bg-gray-400 hover:bg-blue-600 transition-colors"
            >
              {loading ? 'Processing...' : `Upload & Save (${files.length} images)`}
            </button>
            
            {status && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">{status}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Training Section */}
      {databaseImages.length > 0 && !isTrainingComplete && !isTrainingRunning && (
        <div>
          <h2 className="text-xl font-semibold">2. Start Training</h2>
          <p className="text-gray-500">
            Train your personalized model using the uploaded images. The model will use &quot;TOK&quot; as the trigger word.
          </p>
          
          <div className="mt-4">
            <button
              onClick={startTraining}
              disabled={trainingLoading}
              className="px-6 py-3 font-semibold text-white bg-green-500 rounded-lg disabled:bg-gray-400 hover:bg-green-600 transition-colors"
            >
              {trainingLoading ? 'Starting Training...' : 'Start Training'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Training typically takes 20-30 minutes to complete.
            </p>
          </div>
        </div>
      )}

      {isTrainingComplete && (
        <div>
          <h2 className="text-xl font-semibold">3. Generate Images</h2>
          <p className="text-gray-500">
            Enter a prompt to generate a new image using your trained model.
          </p>
          <div className="flex flex-col gap-4 mt-4 max-w-sm">
            <textarea
              placeholder="A photo of TOK as an astronaut..."
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

          {/* Generated Images Gallery */}
          {generatedImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Your Generated Images ({generatedImages.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generatedImages.map((image) => (
                  <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <Image
                      width={200}
                      height={200}
                      src={image.imageUrl}
                      alt={`Generated: ${image.prompt}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        "{image.prompt}"
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 