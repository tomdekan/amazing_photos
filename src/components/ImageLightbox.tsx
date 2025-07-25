"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ThumbnailStrip } from "./ThumbnailStrip";

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

interface ImageLightboxProps {
	images: GeneratedImage[];
	currentIndex: number;
	isOpen: boolean;
	onClose: () => void;
	modelName: string;
}

export function ImageLightbox({
	images,
	currentIndex,
	isOpen,
	onClose,
	modelName,
}: ImageLightboxProps) {
	const [selectedIndex, setSelectedIndex] = useState(currentIndex);

	useEffect(() => {
		setSelectedIndex(currentIndex);
	}, [currentIndex]);

	const goToPrevious = useCallback(() => {
		setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
	}, [images.length]);

	const goToNext = useCallback(() => {
		setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
	}, [images.length]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return;

			switch (e.key) {
				case "Escape":
					onClose();
					break;
				case "ArrowLeft":
					goToPrevious();
					break;
				case "ArrowRight":
					goToNext();
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose, goToPrevious, goToNext]);

	if (!isOpen || images.length === 0) return null;

	const currentImage = images[selectedIndex];

	return (
		<div
			className="fixed inset-0 h-full w-full z-50 bg-black/95 backdrop-blur-sm"
			aria-hidden="true"
		>
			<button
				type="button"
				onClick={onClose}
				className="absolute inset-0 w-full h-full cursor-default"
				aria-label="Close lightbox"
			/>
			{/* Header */}
			<div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6 pointer-events-none">
				<div className="flex items-center justify-between pointer-events-auto">
					<div>
						<h2 className="text-xl font-semibold text-white">
							{modelName} Gallery
						</h2>
						<p className="text-sm text-slate-300">
							{selectedIndex + 1} of {images.length} images
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Close</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Main Image */}
			<div className="flex items-center justify-center h-full p-8 pointer-events-none">
				<div className="relative max-w-5xl max-h-full w-full h-full group pointer-events-auto">
					<Image
						src={currentImage.imageUrl}
						alt={currentImage.prompt}
						fill
						style={{ objectFit: "contain" }}
						className="rounded-lg transition-transform duration-300 ease-in-out group-hover:scale-[1.02]"
						priority
					/>
					<a
						href={currentImage.imageUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="absolute inset-0 cursor-pointer"
						aria-label="Open image in new tab"
					>
						<span className="sr-only">Open image in a new tab</span>
					</a>
					<div className="top-1/5 md:w-1/5 right-0 p-4 bg-black/50">
						<p className="font-bold text-lg mb-2">Image Details</p>
						<p className="text-sm mb-2">{currentImage.prompt}</p>
						<p className="text-xs text-slate-300">
							Generated on{" "}
							{new Date(currentImage.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
			</div>

			{/* Navigation Arrows */}
			{images.length > 1 && (
				<>
					<button
						type="button"
						onClick={goToPrevious}
						className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Previous</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</button>
					<button
						type="button"
						onClick={goToNext}
						className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Next</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</button>
				</>
			)}

			{/* Thumbnail Strip */}
			{images.length > 1 && (
				<ThumbnailStrip
					images={images}
					selectedIndex={selectedIndex}
					setSelectedIndex={setSelectedIndex}
				/>
			)}
		</div>
	);
}
