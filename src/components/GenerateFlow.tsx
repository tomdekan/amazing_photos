"use client";

import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { TrainingRecord } from "../lib/db";
import { ConfirmationModal } from "./ConfirmationModal";

type User = {
	id: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
};

type UploadingImage = {
	file: File;
	preview: string;
	status:
		| "pending"
		| "processing"
		| "ready"
		| "uploading"
		| "saving"
		| "completed"
		| "error";
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
	const [isDragOver, setIsDragOver] = useState(false);
	const [isConfirmationOpen, setConfirmationOpen] = useState(false);
	const [isUploadingAndTraining, setUploadingAndTraining] = useState(false);

	// Pre-check file before processing
	function checkFileViability(
		file: File,
	): Promise<{ viable: boolean; reason?: string }> {
		return new Promise((resolve) => {
			// Quick size check first
			if (file.size > 25_000_000) {
				// 25MB hard limit
				resolve({ viable: false, reason: "File too large (>25MB)" });
				return;
			}

			const img = document.createElement("img");
			img.onload = () => {
				const pixelCount = img.width * img.height;

				// Check dimensions (cap before processing)
				// Increased limits to handle DSLR photos like 6048×8064 (48MP)
				if (file.size > 25_000_000 || pixelCount > 50_000_000) {
					resolve({
						viable: false,
						reason: "Image too large for browser processing",
					});
				} else {
					resolve({ viable: true });
				}

				URL.revokeObjectURL(img.src);
			};

			img.onerror = () => {
				resolve({ viable: false, reason: "Invalid image file" });
				URL.revokeObjectURL(img.src);
			};

			img.src = URL.createObjectURL(file);
		});
	}

	// Image resizing function with OffscreenCanvas support
	function resizeImage(
		file: File,
		maxWidth = 2048,
		maxHeight = 2048,
		quality = 0.8,
	): Promise<File> {
		return new Promise((resolve) => {
			// Check if we can use OffscreenCanvas for better performance
			const canUseOffscreen =
				"OffscreenCanvas" in window && "createImageBitmap" in window;

			if (canUseOffscreen) {
				// Use OffscreenCanvas for better performance (off main thread)
				createImageBitmap(file)
					.then((bitmap) => {
						const { width: origWidth, height: origHeight } = bitmap;

						// Calculate new dimensions
						const { width, height } = calculateDimensions(
							origWidth,
							origHeight,
							maxWidth,
							maxHeight,
						);

						const canvas = new OffscreenCanvas(width, height);
						const ctx = canvas.getContext("2d");

						if (ctx) {
							ctx.drawImage(bitmap, 0, 0, width, height);

							canvas
								.convertToBlob({ type: file.type, quality })
								.then((blob) => {
									if (blob) {
										const resizedFile = new File([blob], file.name, {
											type: file.type,
											lastModified: Date.now(),
										});
										resolve(resizedFile);
									} else {
										resolve(file);
									}
								});
						} else {
							resolve(file);
						}
					})
					.catch(() => resolve(file));
			} else {
				// Fallback to regular canvas (main thread)
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				const img = document.createElement("img");

				img.onload = () => {
					// Calculate new dimensions
					const { width, height } = calculateDimensions(
						img.width,
						img.height,
						maxWidth,
						maxHeight,
					);

					// Set canvas dimensions
					canvas.width = width;
					canvas.height = height;

					// Draw and compress
					if (ctx) {
						ctx.drawImage(img, 0, 0, width, height);
					}

					canvas.toBlob(
						(blob) => {
							if (blob) {
								const resizedFile = new File([blob], file.name, {
									type: file.type,
									lastModified: Date.now(),
								});
								resolve(resizedFile);
							} else {
								resolve(file);
							}
						},
						file.type,
						quality,
					);
				};

				img.src = URL.createObjectURL(file);
			}
		});
	}

	// Helper function to calculate dimensions
	function calculateDimensions(
		origWidth: number,
		origHeight: number,
		maxWidth: number,
		maxHeight: number,
	) {
		let width = origWidth;
		let height = origHeight;

		if (width > height) {
			if (width > maxWidth) {
				height = (height * maxWidth) / width;
				width = maxWidth;
			}
		} else {
			if (height > maxHeight) {
				width = (width * maxHeight) / height;
				height = maxHeight;
			}
		}

		return { width, height };
	}

	// Process files with resizing
	async function processFiles(selectedFiles: File[]) {
		const maxSizeBytes = 8 * 1024 * 1024; // 8MB threshold for resizing

		// Create initial preview objects
		const initialPreviews = selectedFiles.map((file) => ({
			file,
			preview: URL.createObjectURL(file),
			status: "pending" as const,
			progress: 0,
		}));
		setUploadingImages(initialPreviews);

		// Process all files in parallel
		const processPromises = selectedFiles.map(async (file, index) => {
			// Update to processing status
			setUploadingImages((prev) =>
				prev.map((item, i) =>
					i === index ? { ...item, status: "processing" as const } : item,
				),
			);

			try {
				// Pre-check file viability
				const viabilityCheck = await checkFileViability(file);
				if (!viabilityCheck.viable) {
					// Log file viability failure (dev only)
					if (process.env.NODE_ENV !== "production") {
						console.warn("⚠️ File viability check failed:", {
							filename: file.name,
							fileSize: file.size,
							fileType: file.type,
							reason: viabilityCheck.reason,
							timestamp: new Date().toISOString(),
						});
					}

					toast.error(`${file.name}: ${viabilityCheck.reason}`, {
						description:
							"Try using a smaller image or resize it before uploading.",
					});

					// Update to error status
					setUploadingImages((prev) =>
						prev.map((item, i) =>
							i === index
								? {
										...item,
										status: "error" as const,
										error: viabilityCheck.reason,
									}
								: item,
						),
					);

					return {
						file,
						preview: {
							file,
							preview: URL.createObjectURL(file),
							status: "error" as const,
							progress: 0,
							error: viabilityCheck.reason,
						},
					};
				} else {
					let processedFile = file;

					// Resize if file is too large
					if (file.size > maxSizeBytes) {
						if (process.env.NODE_ENV !== "production") {
							console.log(
								`📏 Resizing ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
							);
						}
						processedFile = await resizeImage(file);
						if (process.env.NODE_ENV !== "production") {
							console.log(
								`✅ Resized to ${(processedFile.size / (1024 * 1024)).toFixed(1)}MB`,
							);
						}
					}

					const newPreview = URL.createObjectURL(processedFile);

					// Update to ready status
					setUploadingImages((prev) =>
						prev.map((item, i) =>
							i === index
								? {
										...item,
										file: processedFile,
										preview: newPreview,
										status: "ready" as const,
									}
								: item,
						),
					);

					return {
						file: processedFile,
						preview: {
							file: processedFile,
							preview: newPreview,
							status: "ready" as const,
							progress: 0,
						},
					};
				}
			} catch (error) {
				const errorMessage = (error as Error).message;

				// Log processing error with context (dev only)
				if (process.env.NODE_ENV !== "production") {
					console.error("❌ File processing failed:", {
						filename: file.name,
						fileSize: file.size,
						fileType: file.type,
						error: errorMessage,
						stack: (error as Error).stack,
						timestamp: new Date().toISOString(),
					});
				}

				// Show user notification for processing error
				toast.error(`Failed to process ${file.name}`, {
					description: errorMessage,
				});

				// Update to error status
				setUploadingImages((prev) =>
					prev.map((item, i) =>
						i === index
							? {
									...item,
									status: "error" as const,
									error: "Processing failed",
								}
							: item,
					),
				);

				return {
					file,
					preview: {
						file,
						preview: URL.createObjectURL(file),
						status: "error" as const,
						progress: 0,
						error: "Processing failed",
					},
				};
			}
		});

		// Wait for all files to be processed in parallel
		const results = await Promise.all(processPromises);

		// Extract processed files and previews
		const processedFiles = results.map((result) => result.file);
		const processedPreviews = results.map((result) => result.preview);

		setFiles(processedFiles);
		setUploadingImages(processedPreviews);
	}

	const fetchDatabaseImages = useCallback(async () => {
		try {
			const response = await fetch("/api/debug-images");
			const data = await response.json();
			if (data.success) {
				setDatabaseImages(data.images);
				if (process.env.NODE_ENV !== "production") {
					console.info("📊 Database images:", data);
				}
			} else {
				if (process.env.NODE_ENV !== "production") {
					console.error("Failed to fetch database images:", data.error);
				}
			}
		} catch (error) {
			if (process.env.NODE_ENV !== "production") {
				console.error("Error fetching database images:", error);
			}
		}
	}, []);

	const fetchGeneratedImages = useCallback(async () => {
		try {
			const response = await fetch(`/api/generated-images?userId=${user.id}`);
			const data = await response.json();
			if (data.success) {
				setGeneratedImages(data.images);
				if (process.env.NODE_ENV !== "production") {
					console.info("📊 Generated images:", data);
				}
			} else {
				if (process.env.NODE_ENV !== "production") {
					console.error("Failed to fetch generated images:", data.error);
				}
			}
		} catch (error) {
			if (process.env.NODE_ENV !== "production") {
				console.error("Error fetching generated images:", error);
			}
		}
	}, [user.id]);

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
					if (process.env.NODE_ENV !== "production") {
						console.info("📊 Training status updated:", data.training.status);
					}
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
				if (process.env.NODE_ENV !== "production") {
					console.error("❌ Error polling training status:", error);
				}
			}
		};

		// Poll every 30 seconds if training is in progress
		const interval = setInterval(pollTrainingStatus, 30000);

		// Also check immediately
		pollTrainingStatus();

		return () => clearInterval(interval);
	}, [trainingRecord, fetchGeneratedImages]);

	function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
		processFiles(selectedFiles);
	}

	function handleDragOver(e: React.DragEvent<HTMLElement>) {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	}

	function handleDragLeave(e: React.DragEvent<HTMLElement>) {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	}

	function handleDrop(e: React.DragEvent<HTMLElement>) {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);

		const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
			file.type.startsWith("image/"),
		);

		if (droppedFiles.length === 0) {
			setStatus("Please drop only image files (PNG, JPG, JPEG)");
			return;
		}

		processFiles(droppedFiles);
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

	function calculateOverallProgress(): {
		progress: number;
		isUploading: boolean;
		completedCount: number;
		processingCount: number;
		uploadingCount: number;
	} {
		if (uploadingImages.length === 0) {
			return {
				progress: 0,
				isUploading: false,
				completedCount: 0,
				processingCount: 0,
				uploadingCount: 0,
			};
		}

		// Count different phases
		const processingCount = uploadingImages.filter(
			(img) => img.status === "processing",
		).length;
		const readyCount = uploadingImages.filter(
			(img) => img.status === "ready",
		).length;
		const uploadingCount = uploadingImages.filter(
			(img) => img.status === "uploading" || img.status === "saving",
		).length;
		const completedCount = uploadingImages.filter(
			(img) => img.status === "completed",
		).length;
		const pendingCount = uploadingImages.filter(
			(img) => img.status === "pending",
		).length;

		// Calculate progress based only on completed uploads
		let totalProgress = 0;

		// Count fully completed uploads (100% each)
		const fullyCompletedProgress =
			(completedCount / uploadingImages.length) * 100;

		// Add partial progress from files currently uploading
		const uploadingProgress =
			uploadingImages
				.filter((img) => img.status === "uploading" || img.status === "saving")
				.reduce((sum, img) => sum + img.progress, 0) / uploadingImages.length;

		totalProgress = Math.round(fullyCompletedProgress + uploadingProgress);

		const isUploading = processingCount > 0 || uploadingCount > 0;

		return {
			progress: totalProgress,
			isUploading,
			completedCount,
			processingCount,
			uploadingCount,
		};
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

			if (process.env.NODE_ENV !== "production") {
				console.info("✅ Saved to database:", data.imageId);
			}
			return data.imageId;
		} catch (error) {
			if (process.env.NODE_ENV !== "production") {
				console.error("❌ Database save error:", error);
			}
			throw error;
		}
	}

	async function handleUploadAndTrain() {
		if (files.length === 0) {
			setStatus("Please select at least one image.");
			return;
		}
		if (files.length < 5 || files.length > 30) {
			setStatus("Please select between 5 and 30 images.");
			return;
		}
		if (!sex) {
			setStatus("Please select the subject's sex.");
			toast.error("Sex is required", {
				description: "Please select the subject's sex before proceeding.",
			});
			return;
		}

		setUploadingAndTraining(true);
		setLoading(true);
		if (process.env.NODE_ENV !== "production") {
			console.info("🚀 Starting upload with", files.length, "files");
		}

		try {
			setStatus("Uploading images...");

			// Upload all files in parallel
			const uploadPromises = uploadingImages.map(async (imageData, index) => {
				try {
					// Step 1: Upload to Vercel Blob
					setUploadingImages((prev) =>
						prev.map((img, idx) =>
							idx === index
								? { ...img, status: "uploading", progress: 0 }
								: img,
						),
					);

					if (process.env.NODE_ENV !== "production") {
						console.info(
							"📤 Uploading to blob:",
							imageData.file.name,
							imageData.file.size,
							"bytes",
						);
					}

					// Simulate progress for upload
					const progressInterval = setInterval(() => {
						setUploadingImages((prev) =>
							prev.map((img, idx) =>
								idx === index && img.status === "uploading"
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
					if (process.env.NODE_ENV !== "production") {
						console.info("✅ Blob uploaded:", blob.url);
					}

					// Step 2: Save to database
					setUploadingImages((prev) =>
						prev.map((img, idx) =>
							idx === index ? { ...img, status: "saving", progress: 85 } : img,
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
							idx === index
								? {
										...img,
										status: "completed",
										progress: 100,
										blobUrl: blob.url,
									}
								: img,
						),
					);

					return blob;
				} catch (error) {
					const errorMessage = (error as Error).message;

					// Comprehensive error logging (dev only)
					if (process.env.NODE_ENV !== "production") {
						console.error("❌ Upload failed:", {
							filename: imageData.file.name,
							fileSize: imageData.file.size,
							fileType: imageData.file.type,
							uploadBatchId,
							error: errorMessage,
							stack: (error as Error).stack,
							timestamp: new Date().toISOString(),
						});
					}

					// Show user-friendly toast notification
					toast.error(`Failed to upload ${imageData.file.name}`, {
						description: `Error: ${errorMessage}`,
					});

					setUploadingImages((prev) =>
						prev.map((img, idx) =>
							idx === index
								? {
										...img,
										status: "error",
										error: errorMessage,
									}
								: img,
						),
					);
					return null;
				}
			});

			// Wait for all uploads to complete
			const results = await Promise.all(uploadPromises);
			const uploadedBlobs = results.filter((blob) => blob !== null);
			const failedCount = results.length - uploadedBlobs.length;

			// Log upload summary (dev only)
			if (process.env.NODE_ENV !== "production") {
				console.info("📊 Upload Summary:", {
					totalFiles: uploadingImages.length,
					successful: uploadedBlobs.length,
					failed: failedCount,
					uploadBatchId,
					timestamp: new Date().toISOString(),
				});
			}

			if (failedCount > 0) {
				if (process.env.NODE_ENV !== "production") {
					console.warn(
						`⚠️ ${failedCount} files failed to upload out of ${uploadingImages.length} total`,
					);
				}
				toast.error(`${failedCount} files failed to upload`, {
					description: `${uploadedBlobs.length} files uploaded successfully`,
				});
			}

			if (failedCount > 0) {
				setStatus(
					`Uploaded ${uploadedBlobs.length} of ${uploadingImages.length} images. ${failedCount} failed. Training cannot start.`,
				);
				setUploadingAndTraining(false);
				setLoading(false);
				return;
			}

			setStatus(
				uploadedBlobs.length === uploadingImages.length
					? `Successfully uploaded ${uploadedBlobs.length} images! 🎉 Now starting training...`
					: `Uploaded ${uploadedBlobs.length} of ${uploadingImages.length} images. ${failedCount} failed.`,
			);

			// Refresh database images after upload
			setTimeout(() => {
				fetchDatabaseImages();
			}, 1000);

			// Start training after successful upload
			try {
				if (process.env.NODE_ENV !== "production") {
					console.info("🚀 Starting training...");
				}

				const response = await fetch("/api/start-training", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sex }),
				});

				const data = await response.json();

				if (!data.success) {
					throw new Error(data.error || "Failed to start training");
				}

				if (process.env.NODE_ENV !== "production") {
					console.info("✅ Training started:", data.trainingId);
				}
				setStatus(
					`Training started successfully! You will be notified when it's complete.`,
				);

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
				const errorMessage = (error as Error).message;
				if (process.env.NODE_ENV !== "production") {
					console.error("❌ Training start error:", error);
				}
				setStatus(`Failed to start training: ${errorMessage}`);
				toast.error("Training Failed", { description: errorMessage });
			}
		} catch (error) {
			const errorMessage = (error as Error).message;

			// Log unexpected upload process errors (dev only)
			if (process.env.NODE_ENV !== "production") {
				console.error("❌ Upload process failed:", {
					error: errorMessage,
					stack: (error as Error).stack,
					uploadBatchId,
					fileCount: files.length,
					timestamp: new Date().toISOString(),
				});
			}

			// Show user notification
			toast.error("Upload process failed", {
				description: errorMessage,
			});

			setStatus(`An error occurred: ${errorMessage}`);
		} finally {
			setUploadingAndTraining(false);
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
			if (process.env.NODE_ENV !== "production") {
				console.error(error);
			}
			alert("An error occurred while generating the image.");
		} finally {
			setLoading(false);
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
							This takes around 5 minutes. You can leave this page and come back
							later.
						</p>
					</div>
				)}
				{!isTrainingComplete && !isTrainingRunning && (
					<div className="mt-4">
						{/* File Input */}
						<div className="mb-6">
							<button
								type="button"
								className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
									isDragOver
										? "border-indigo-400 bg-indigo-900/20"
										: "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
								}`}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onClick={() => document.getElementById("file-input")?.click()}
								aria-label="Upload images by clicking or dragging and dropping"
							>
								<div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
									<svg
										className={`w-8 h-8 mb-4 transition-colors ${
											isDragOver ? "text-indigo-400" : "text-slate-500"
										}`}
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
									<p
										className={`mb-2 text-sm transition-colors ${
											isDragOver ? "text-indigo-300" : "text-slate-400"
										}`}
									>
										<span
											className={`font-semibold ${
												isDragOver ? "text-indigo-400" : "text-indigo-400"
											}`}
										>
											{isDragOver ? "Drop images here" : "Click to upload"}
										</span>{" "}
										{!isDragOver && "or drag and drop"}
									</p>
									<p
										className={`text-xs transition-colors ${
											isDragOver ? "text-indigo-400" : "text-slate-500"
										}`}
									>
										PNG, JPG, JPEG (Smart processing & auto-resize)
									</p>
								</div>
							</button>
							<input
								id="file-input"
								type="file"
								accept="image/*"
								multiple
								onChange={handleFileSelect}
								className="hidden"
							/>
						</div>

						{/* Image Preview Grid */}
						{uploadingImages.length > 0 && (
							<div className="mb-6">
								<h3 className="text-lg font-medium mb-4 text-white">
									Selected Images ({uploadingImages.length})
								</h3>

								{/* Overall Progress Bar */}
								{(() => {
									const {
										progress,
										isUploading,
										completedCount,
										processingCount,
										uploadingCount,
									} = calculateOverallProgress();

									// Determine current phase message
									let statusMessage = "";
									if (processingCount > 0) {
										statusMessage = `Resizing ${processingCount} image${processingCount > 1 ? "s" : ""}...`;
									} else if (uploadingCount > 0) {
										statusMessage = `Uploading ${uploadingCount} image${uploadingCount > 1 ? "s" : ""}... (${completedCount}/${uploadingImages.length} uploaded)`;
									} else if (completedCount === uploadingImages.length) {
										statusMessage = `All ${uploadingImages.length} images uploaded successfully`;
									} else {
										statusMessage = `${completedCount}/${uploadingImages.length} images uploaded`;
									}

									return (
										<div className="mb-4">
											<div className="flex justify-between items-center mb-2">
												<span className="text-sm text-slate-400">
													{statusMessage}
												</span>
												<span className="text-sm text-slate-400">
													{progress}%
												</span>
											</div>
											<div className="w-full bg-slate-700 rounded-full h-2">
												<div
													className={`h-2 rounded-full transition-all duration-300 ${
														progress === 100
															? "bg-green-500"
															: processingCount > 0
																? "bg-yellow-500"
																: "bg-indigo-500"
													}`}
													style={{ width: `${progress}%` }}
												></div>
											</div>
										</div>
									);
								})()}

								<div className="overflow-x-auto">
									<div className="flex gap-4 pb-4 min-w-min">
										{uploadingImages.map((imageData, index) => (
											<div
												key={`${imageData.file.name}-${index}`}
												className="relative group flex-shrink-0 w-24 text-center"
											>
												{/* Image Container */}
												<div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-800 shadow-sm border border-slate-700 mx-auto">
													<Image
														src={imageData.preview}
														alt={`Preview ${index + 1}`}
														fill
														className="object-cover"
														quality={30}
														sizes="64px"
													/>

													{/* Status Overlay */}
													{imageData.status !== "pending" && (
														<div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
															{imageData.status === "processing" && (
																<div className="text-center text-white">
																	<div className="w-4 h-4 mx-auto mb-1 border border-white border-t-transparent rounded-full animate-spin"></div>
																	<div className="text-[8px]">Resizing...</div>
																</div>
															)}
															{(imageData.status === "uploading" ||
																imageData.status === "saving") && (
																<div className="text-center text-white">
																	<div className="w-4 h-4 mx-auto mb-1 border border-white border-t-transparent rounded-full animate-spin"></div>
																	<div className="text-[8px]">
																		{Math.round(imageData.progress)}%
																	</div>
																</div>
															)}
															{imageData.status === "completed" && (
																<div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
																	<svg
																		className="w-3 h-3 text-white"
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
																<div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
																	<svg
																		className="w-3 h-3 text-white"
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
													{(imageData.status === "pending" ||
														imageData.status === "ready" ||
														imageData.status === "error") && (
														<button
															type="button"
															onClick={() => removeImage(index)}
															className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-700"
															aria-label="Remove image"
														>
															<svg
																className="w-2.5 h-2.5"
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
												<p className="mt-1 text-xs text-slate-500 truncate w-full">
													{imageData.file.name}
												</p>
												{/* File Size */}
												<p className="text-xs text-slate-600">
													{(imageData.file.size / 1024 / 1024).toFixed(2)} MB
												</p>

												{/* Error Message */}
												{imageData.status === "error" && (
													<p className="mt-1 text-xs text-red-400 truncate w-full">
														{imageData.error}
													</p>
												)}
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{/* Sex Selection */}
						{uploadingImages.length > 0 && (
							<div className="mt-6">
								<h3 className="text-lg font-medium text-white mb-2">
									Subject's Sex
								</h3>
								<p className="text-sm text-slate-400 mb-4">
									This is used to generate more accurate images.
								</p>
								<div className="flex items-center space-x-4">
									<label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg bg-slate-800 hover:bg-slate-700/50 transition-colors">
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
									<label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg bg-slate-800 hover:bg-slate-700/50 transition-colors">
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
						)}

						{/* Final Upload and Train Button */}
						{(() => {
							const isReadyForTraining =
								uploadingImages.length > 0 &&
								uploadingImages.every(
									(img) => img.status === "ready" || img.status === "completed",
								);
							const hasProcessingFiles = uploadingImages.some(
								(img) => img.status === "processing",
							);

							if (!isReadyForTraining || hasProcessingFiles) return null;

							return (
								<div className="mt-8 pt-8 border-t border-slate-700">
									<h3 className="text-xl font-bold text-white">
										Ready to Start?
									</h3>
									<p className="text-slate-400 mt-2">
										This will upload your photos and begin training your
										personalized model.
									</p>
									<button
										type="button"
										onClick={() => setConfirmationOpen(true)}
										disabled={!sex || isUploadingAndTraining}
										className="mt-6 px-8 py-4 font-semibold text-white bg-green-600 rounded-lg disabled:bg-green-400/50 hover:bg-green-500 transition-colors shadow-lg hover:shadow-green-500/30"
									>
										{isUploadingAndTraining
											? "Processing..."
											: "Upload & Train Model"}
									</button>
									<p className="text-xs text-slate-500 mt-2">
										Training typically takes around 5 minutes.
									</p>
								</div>
							);
						})()}

						{status && (
							<div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
								<p className="text-sm text-blue-300">{status}</p>
							</div>
						)}
					</div>
				)}
			</div>
			<ConfirmationModal
				isOpen={isConfirmationOpen}
				onClose={() => setConfirmationOpen(false)}
				onConfirm={() => {
					setConfirmationOpen(false);
					handleUploadAndTrain();
				}}
				isLoading={isUploadingAndTraining}
				title="Ready to Train?"
				message="This will upload your photos and start training your personalized model. This is the final step."
				confirmText="Yes, let's go!"
			/>
			{isTrainingComplete && (
				<div>
					<h2 className="text-xl font-semibold text-white">
						2. Generate Images
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
