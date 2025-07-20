"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { TrainingRecord } from "../lib/db";

type User = {
	id: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
};

type UploadingImage = {
	file: File;
	preview: string;
	status: "pending" | "uploading" | "saving" | "completed" | "error";
	progress: number;
	blobUrl?: string;
	error?: string;
};

type DatabaseImage = {
	id: string;
	filename: string;
	blobUrl: string;
	uploadBatchId: string | null;
	processingStatus: string;
	createdAt: string;
};

type GeneratedImage = {
	id: string;
	userId: string;
	prompt: string;
	imageUrl: string;
	originalUrl: string;
	trainingId: string | null;
	modelVersion: string | null;
	createdAt: string;
	training?: {
		id: string;
		status: string;
	} | null;
};

// Generate a simple UUID
function generateUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export function GenerateFlow({
	user,
	trainingRecord: initialTrainingRecord,
}: {
	user: User;
	trainingRecord: TrainingRecord | null;
}) {
	const [files, setFiles] = useState<File[]>([]);
	const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
	const [databaseImages, setDatabaseImages] = useState<DatabaseImage[]>([]);
	const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
	const [status, setStatus] = useState("");
	const [prompt, setPrompt] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [trainingRecord, setTrainingRecord] = useState(initialTrainingRecord);
	const [uploadBatchId, setUploadBatchId] = useState<string>("");
	const [trainingLoading, setTrainingLoading] = useState(false);
	const [sex, setSex] = useState<"male" | "female" | "">("");

	const fetchDatabaseImages = useCallback(async () => {
		try {
			const response = await fetch("/api/debug-images");
			const data = await response.json();
			if (data.success) {
				setDatabaseImages(data.images);
				console.info("📊 Database images:", data);
			} else {
				console.error("Failed to fetch database images:", data.error);
			}
		} catch (error) {
			console.error("Error fetching database images:", error);
		}
	}, []);

	const fetchGeneratedImages = useCallback(async () => {
		try {
			const response = await fetch("/api/generated-images");
			const data = await response.json();
			if (data.success) {
				setGeneratedImages(data.images);
				console.info("📊 Generated images:", data);
			} else {
				console.error("Failed to fetch generated images:", data.error);
			}
		} catch (error) {
			console.error("Error fetching generated images:", error);
		}
	}, []);

	// Fetch uploaded images from database on component mount
	useEffect(() => {
		// Generate batch ID only on client side to avoid hydration mismatch
		setUploadBatchId(generateUUID());
		fetchDatabaseImages();
		fetchGeneratedImages();
	}, [fetchDatabaseImages, fetchGeneratedImages]);

	// Poll training status if training is in progress
	useEffect(() => {
		if (
			!trainingRecord ||
			trainingRecord.status === "succeeded" ||
			trainingRecord.status === "failed"
		) {
			return;
		}

		const pollTrainingStatus = async () => {
			try {
				const response = await fetch("/api/check-training");
				const data = await response.json();
				
				if (data.success && data.statusChanged) {
					console.info("📊 Training status updated:", data.training.status);
					setTrainingRecord(data.training);
					
					if (data.training.status === "succeeded") {
						setStatus(
							"🎉 Training completed successfully! Generating 15 starter images for you... You can also create your own images below.",
						);
						// Refresh generated images periodically to show new starter images as they are created
						const refreshInterval = setInterval(() => {
							fetchGeneratedImages();
						}, 10000); // Check every 10 seconds
						
						// Stop refreshing after 5 minutes (should be enough time for all starter images)
						setTimeout(() => {
							clearInterval(refreshInterval);
						}, 300000);
					} else if (data.training.status === "failed") {
						setStatus("❌ Training failed. Please try again.");
					}
				}
			} catch (error) {
				console.error("❌ Error polling training status:", error);
			}
		};

		// Poll every 30 seconds if training is in progress
		const interval = setInterval(pollTrainingStatus, 30000);
		
		// Also check immediately
		pollTrainingStatus();

		return () => clearInterval(interval);
	}, [trainingRecord, fetchGeneratedImages]);

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

	async function saveImageToDatabase(
		filename: string,
		blobUrl: string,
		contentType: string,
		size: number,
	) {
		try {
			const response = await fetch("/api/save-image", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					filename,
					blobUrl,
					contentType,
					size,
					uploadBatchId,
				}),
			});

			const data = await response.json();
			if (!data.success) {
				throw new Error(data.error || "Failed to save to database");
			}

			console.info("✅ Saved to database:", data.imageId);
			return data.imageId;
		} catch (error) {
			console.error("❌ Database save error:", error);
			throw error;
		}
	}

	async function startTraining() {
		setTrainingLoading(true);
		try {
			console.info("🚀 Starting training with hardcoded settings");

			const response = await fetch("/api/start-training", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sex }),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || "Failed to start training");
			}

			console.info("✅ Training started:", data.trainingId);
			setStatus(
				`Training started successfully! Training ID: ${data.trainingId}`,
			);

			// Update training record state
			setTrainingRecord({
				id: data.trainingId,
				userId: user.id,
				status: data.status,
				version: null,
				replicateId: data.trainingId,
				error: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				sex: sex || null,
			});
		} catch (error) {
			console.error("❌ Training start error:", error);
			setStatus(`Failed to start training: ${(error as Error).message}`);
		} finally {
			setTrainingLoading(false);
		}
	}

	async function handleUploadAndTrain() {
		if (files.length === 0) {
			setStatus("Please select at least one image.");
			return;
		}
		if (files.length < 1 || files.length > 20) {
			setStatus("Please select between 5 and 20 images.");
			return;
		}

		setLoading(true);
		console.info("🚀 Starting upload with", files.length, "files");

		try {
			setStatus("Uploading images...");

			// Upload each file individually with progress tracking
			const uploadedBlobs = [];
			for (let i = 0; i < uploadingImages.length; i++) {
				const imageData = uploadingImages[i];

				try {
					// Step 1: Upload to Vercel Blob
					setUploadingImages((prev) =>
						prev.map((img, idx) =>
							idx === i ? { ...img, status: "uploading", progress: 0 } : img,
						),
					);

					console.info(
						"📤 Uploading to blob:",
						imageData.file.name,
						imageData.file.size,
						"bytes",
					);

					// Simulate progress for upload
					const progressInterval = setInterval(() => {
						setUploadingImages((prev) =>
							prev.map((img, idx) =>
								idx === i && img.status === "uploading"
									? {
											...img,
											progress: Math.min(img.progress + Math.random() * 30, 80),
										}
									: img,
							),
						);
					}, 200);

					// Upload to our server which will handle blob upload
					const response = await fetch(
						`/api/blob-upload?filename=${encodeURIComponent(imageData.file.name)}`,
						{
							method: "POST",
							body: imageData.file,
						},
					);

					if (!response.ok) {
						throw new Error(`Upload failed: ${response.statusText}`);
					}

					const blob = await response.json();

					clearInterval(progressInterval);
					console.info("✅ Blob uploaded:", blob.url);

					// Step 2: Save to database
					setUploadingImages((prev) =>
						prev.map((img, idx) =>
							idx === i ? { ...img, status: "saving", progress: 85 } : img,
						),
					);

					await saveImageToDatabase(
						imageData.file.name,
						blob.url,
						imageData.file.type,
						imageData.file.size,
					);

					// Step 3: Mark as completed
					setUploadingImages((prev) =>
						prev.map((img, idx) =>
							idx === i
								? {
										...img,
										status: "completed",
										progress: 100,
										blobUrl: blob.url,
									}
								: img,
						),
					);

					uploadedBlobs.push(blob);
				} catch (error) {
					console.error("❌ Upload error for", imageData.file.name, error);
					setUploadingImages((prev) =>
						prev.map((img, idx) =>
							idx === i
								? {
										...img,
										status: "error",
										error: (error as Error).message,
									}
								: img,
						),
					);
				}
			}

			setStatus(
				`Successfully uploaded ${uploadedBlobs.length} images to database! 🎉`,
			);

			// Refresh database images after upload
			setTimeout(() => {
				fetchDatabaseImages();
			}, 1000);
		} catch (error) {
			console.error("❌ Upload error:", error);
			setStatus(`An error occurred: ${(error as Error).message}`);
		} finally {
			setLoading(false);
		}
	}

	async function handleGenerate() {
		setLoading(true);
		setImageUrl("");
		try {
			const response = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt }),
			});

			const data = await response.json();

			if (data.error) {
				alert(data.error);
			} else {
				setImageUrl(data.imageUrl);
				// Refresh generated images list
				fetchGeneratedImages();
			}
		} catch (error) {
			console.error(error);
			alert("An error occurred while generating the image.");
		} finally {
			setLoading(false);
		}
	}

	function removeImage(index: number) {
		const newFiles = files.filter((_, i) => i !== index);
		const newUploading = uploadingImages.filter((_, i) => i !== index);
		setFiles(newFiles);
		setUploadingImages(newUploading);

		// Cleanup preview URL
		if (uploadingImages[index]) {
			URL.revokeObjectURL(uploadingImages[index].preview);
		}
	}

	const isTrainingComplete = trainingRecord?.status === "succeeded";
	const isTrainingRunning =
		trainingRecord &&
		["starting", "processing"].includes(trainingRecord.status);

	return (
		<div className="space-y-8">

			<div>
				<h2 className="text-xl font-semibold text-white">
					1. Train Your Model
				</h2>
				<p className="text-slate-400">
					Upload 10-20 pictures of yourself (The more the better)
				</p>
				{isTrainingComplete && (
					<div className="p-4 mt-4 text-green-300 bg-green-900/20 border border-green-500/30 rounded-md">
						<p className="font-bold">Training complete!</p>
						<p>You can now generate images with your model.</p>
					</div>
				)}
				{isTrainingRunning && (
					<div className="p-4 mt-4 text-blue-300 bg-blue-900/20 border border-blue-500/30 rounded-md">
						<p className="font-bold">Training in progress...</p>
						<p>
							This can take up to 20 minutes. You can leave this page and come
							back later.
						</p>
					</div>
				)}
				{!isTrainingComplete && !isTrainingRunning && (
					<div className="mt-4">
						{/* File Input */}
						<div className="mb-6">
							<label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition-colors">
								<div className="flex flex-col items-center justify-center pt-5 pb-6">
									<svg
										className="w-8 h-8 mb-4 text-slate-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
										/>
									</svg>
									<p className="mb-2 text-sm text-slate-400">
										<span className="font-semibold text-indigo-400">
											Click to upload
										</span>{" "}
										or drag and drop
									</p>
									<p className="text-xs text-slate-500">
										PNG, JPG, JPEG (MAX. 10MB each)
									</p>
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
								<h3 className="text-lg font-medium mb-4 text-white">
									Selected Images ({uploadingImages.length})
								</h3>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
									{uploadingImages.map((imageData, index) => (
										<div
											key={`${imageData.file.name}-${index}`}
											className="relative group"
										>
											{/* Image Container */}
											<div className="relative aspect-square rounded-lg overflow-hidden bg-slate-800 shadow-sm border border-slate-700">
												<Image
													src={imageData.preview}
													alt={`Preview ${index + 1}`}
													fill
													className="object-cover"
												/>

												{/* Status Overlay */}
												{imageData.status !== "pending" && (
													<div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
														{(imageData.status === "uploading" ||
															imageData.status === "saving") && (
															<div className="text-center text-white">
																<output
																	className="w-8 h-8 mx-auto mb-2 border-2 border-white border-t-transparent rounded-full animate-spin"
																	aria-label="Uploading"
																></output>
																<div className="text-xs">
																	{Math.round(imageData.progress)}%
																</div>
																<div className="text-xs">
																	{imageData.status === "saving"
																		? "Saving..."
																		: "Uploading..."}
																</div>
															</div>
														)}
														{imageData.status === "completed" && (
															<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
																<svg
																	className="w-5 h-5 text-white"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																	aria-hidden="true"
																>
																	<title>Upload completed</title>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M5 13l4 4L19 7"
																	/>
																</svg>
															</div>
														)}
														{imageData.status === "error" && (
															<div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
																<svg
																	className="w-5 h-5 text-white"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																	aria-hidden="true"
																>
																	<title>Upload failed</title>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M6 18L18 6M6 6l12 12"
																	/>
																</svg>
															</div>
														)}
													</div>
												)}

												{/* Remove Button */}
												{imageData.status === "pending" && (
													<button
														type="button"
														onClick={() => removeImage(index)}
														className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-700"
														aria-label="Remove image"
													>
														<svg
															className="w-4 h-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
															aria-hidden="true"
														>
															<title>Remove image</title>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M6 18L18 6M6 6l12 12"
															/>
														</svg>
													</button>
												)}
											</div>

											{/* File Name */}
											<p className="mt-1 text-xs text-slate-500 truncate">
												{imageData.file.name}
											</p>

											{/* Error Message */}
											{imageData.status === "error" && (
												<p className="mt-1 text-xs text-red-400 truncate">
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
							type="button"
							onClick={handleUploadAndTrain}
							disabled={files.length === 0 || loading}
							className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg disabled:bg-indigo-400/50 hover:bg-indigo-500 transition-colors"
						>
							{loading
								? "Processing..."
								: `Upload & Save (${files.length} images)`}
						</button>

						{status && (
							<div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
								<p className="text-sm text-blue-300">{status}</p>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Training Section */}
			{databaseImages.length > 0 &&
				!isTrainingComplete &&
				!isTrainingRunning && (
					<div>
						<h2 className="text-xl font-semibold text-white">
							2. Start Training
						</h2>
						<p className="text-slate-400">
							Train your personalized model using the uploaded images. The model
							will use &quot;TOK&quot; as the trigger word.
						</p>

						<div className="mt-4">
							<div className="mb-4">
								<h3 className="text-lg font-medium text-white mb-2">
									Subject Sex
								</h3>
								<div className="flex items-center space-x-4">
									<label className="flex items-center space-x-2 cursor-pointer">
										<input
											type="radio"
											name="sex"
											value="male"
											checked={sex === "male"}
											onChange={(e) => setSex(e.target.value as "male")}
											className="form-radio h-4 w-4 text-indigo-600 bg-slate-700 border-slate-600 focus:ring-indigo-500"
										/>
										<span className="text-slate-300">Male</span>
									</label>
									<label className="flex items-center space-x-2 cursor-pointer">
										<input
											type="radio"
											name="sex"
											value="female"
											checked={sex === "female"}
											onChange={(e) => setSex(e.target.value as "female")}
											className="form-radio h-4 w-4 text-indigo-600 bg-slate-700 border-slate-600 focus:ring-indigo-500"
										/>
										<span className="text-slate-300">Female</span>
									</label>
								</div>
							</div>
							<button
								type="button"
								onClick={startTraining}
								disabled={trainingLoading || !sex}
								className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg disabled:bg-gray-400/50 hover:bg-green-500 transition-colors"
							>
								{trainingLoading ? "Starting Training..." : "Start Training"}
							</button>
							<p className="text-xs text-slate-500 mt-2">
								Training typically takes 20-30 minutes to complete.
							</p>
						</div>
					</div>
				)}

			{isTrainingComplete && (
				<div>
					<h2 className="text-xl font-semibold text-white">
						3. Generate Images
					</h2>
					<p className="text-slate-400">
						Enter a prompt to generate a new image using your trained model.
					</p>
					<div className="flex flex-col gap-4 mt-4 max-w-sm">
						<textarea
							placeholder="A photo of TOK as an astronaut..."
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							className="w-full p-2 bg-slate-800 border border-slate-700 text-white rounded-md placeholder:text-slate-500"
							rows={3}
						/>
						<button
							type="button"
							onClick={handleGenerate}
							disabled={!prompt || loading}
							className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md disabled:bg-green-400/50 hover:bg-green-500"
						>
							{loading ? "Generating…" : "Generate"}
						</button>
					</div>

					{imageUrl && (
						<div className="mt-6">
							<h3 className="text-lg font-semibold text-white">Result:</h3>
							<Image
								width={300}
								height={300}
								src={imageUrl}
								alt="Generated image"
								className="mt-2 border-4 border-slate-700 rounded-lg shadow-md"
							/>
						</div>
					)}

					{/* Generated Images Gallery */}
					{generatedImages.length > 0 && (
						<div className="mt-8">
							<h3 className="text-lg font-semibold mb-4 text-white">
								Your Generated Images ({generatedImages.length})
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{generatedImages.map((image) => (
									<div
										key={image.id}
										className="bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-700"
									>
										<Image
											width={200}
											height={200}
											src={image.imageUrl}
											alt={`Generated: ${image.prompt}`}
											className="w-full h-48 object-cover"
										/>
										<div className="p-3">
											<p className="text-sm text-slate-300 line-clamp-2 mb-2">
												&quot;{image.prompt}&quot;
											</p>
											<p className="text-xs text-slate-500">
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
	);
}
