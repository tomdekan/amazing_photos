"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { AvailableModel } from "./ModelSelector";
import { ImageLightbox } from "./ImageLightbox";
import { ImagePlaceholder } from "./ImagePlaceholder";

interface GeneratedImage {
	id: string;
	userId: string;
	prompt: string;
	imageUrl: string;
	originalUrl: string;
	trainingId: string | null;
	modelVersion: string | null;
	createdAt: string;
}

interface ImageGalleryProps {
	selectedModel: AvailableModel | null;
	userId: string;
	isGenerating: boolean;
	generationPrompt: string;
	generationTimer: number;
}

function EmptyGalleryPlaceholder({ modelName }: { modelName: string }) {
	return (
		<div className="flex flex-col items-center justify-center h-full bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-600">
			<div className="text-center p-8">
				<div className="w-16 h-16 bg-slate-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
					<svg
						className="w-8 h-8 text-slate-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Empty gallery placeholder</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
						/>
					</svg>
				</div>
				<h3 className="text-lg font-medium text-slate-300 mb-2">
					No images yet with {modelName}
				</h3>
				<p className="text-sm text-slate-500">
					Generate your first image to see it appear here
				</p>
			</div>
		</div>
	);
}

export function ImageGallery({
	selectedModel,
	userId,
	isGenerating,
	generationPrompt,
	generationTimer,
}: ImageGalleryProps) {
	const [images, setImages] = useState<GeneratedImage[]>([]);
	const [loading, setLoading] = useState(false);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	useEffect(() => {
		if (!selectedModel) {
			setImages([]);
			return;
		}

		const fetchImages = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams({
					userId,
					modelType: selectedModel.type,
					modelId: selectedModel.id,
				});

				const response = await fetch(`/api/generated-images?${params}`);
				if (response.ok) {
					const data = await response.json();
					setImages(data.images || []);
				}
			} catch (error) {
				console.error("Failed to fetch images:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchImages();
	}, [selectedModel, userId]);

	const handleImageClick = (index: number) => {
		setLightboxIndex(index);
		setLightboxOpen(true);
	};

	if (!selectedModel) {
		return (
			<div className="h-full bg-slate-800/30 rounded-lg border border-slate-700 flex items-center justify-center">
				<p className="text-slate-400">Select a model to view images</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="h-full bg-slate-800/30 rounded-lg border border-slate-700 flex items-center justify-center">
				<div className="flex items-center space-x-2">
					<div className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full"></div>
					<p className="text-slate-400">Loading images...</p>
				</div>
			</div>
		);
	}

	if (images.length === 0 && !isGenerating) {
		return <EmptyGalleryPlaceholder modelName={selectedModel.name} />;
	}

	return (
		<>
			<div className="h-full flex flex-col">
				{/* Gallery Header - Fixed */}
				<div className="flex items-center justify-between mb-4 flex-shrink-0">
					<h3 className="text-lg font-semibold text-white">
						{selectedModel.name} Gallery
					</h3>
					<span className="text-sm text-slate-400">
						{images.length} image{images.length !== 1 ? "s" : ""}
					</span>
				</div>

				{/* Gallery Grid - Scrollable */}
				<div className="flex-1 overflow-y-auto">
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
						{isGenerating && (
							<ImagePlaceholder
								prompt={generationPrompt}
								timer={generationTimer}
							/>
						)}
						{images.map((image, index) => (
							<button
								key={image.id}
								type="button"
								onClick={() => handleImageClick(index)}
								className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden group cursor-pointer"
							>
								<Image
									src={image.imageUrl}
									alt={image.prompt}
									fill
									style={{ objectFit: "cover" }}
									className="transition-transform group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
								<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<p className="text-white text-xs line-clamp-2">
										{image.prompt}
									</p>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>

			<ImageLightbox
				images={images}
				currentIndex={lightboxIndex}
				isOpen={lightboxOpen}
				onClose={() => setLightboxOpen(false)}
				modelName={selectedModel.name}
			/>
		</>
	);
}
