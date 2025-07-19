"use client";

import Image from "next/image";
import type { Session } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DownloadIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6 text-white"
	>
		<title>Download</title>
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7 10 12 15 17 10" />
		<line x1="12" y1="15" x2="12" y2="3" />
	</svg>
);

const ImageSpinner = () => (
	<svg
		className="animate-spin h-12 w-12 text-white"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		role="status"
	>
		<title>Loading image</title>
		<circle
			className="opacity-25"
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			strokeWidth="4"
		></circle>
		<path
			className="opacity-75"
			fill="currentColor"
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
		></path>
	</svg>
);

const handleDownload = async (imageUrl: string) => {
	try {
		const response = await fetch(imageUrl);
		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "generated-image.webp";
		document.body.appendChild(a);
		a.click();
		a.remove();
		window.URL.revokeObjectURL(url);
	} catch (error) {
		console.error("Error downloading image:", error);
	}
};

interface GeneratedImageDisplayProps {
	imageUrl: string | null;
	session: Session | null;
	onClose: () => void;
}

export default function GeneratedImageDisplay({
	imageUrl,
	session,
	onClose,
}: GeneratedImageDisplayProps) {
	const router = useRouter();
	const [isImageLoading, setIsImageLoading] = useState(true);
	if (!imageUrl) return null;

	const userName = session?.user?.name?.split(" ")[0] || "there";

	const handleCtaClick = () => {
		router.push("/generate");
	};

	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	return (
		<div
			onClick={handleBackdropClick}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			tabIndex={-1}
			className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
		>
			<div className="relative w-full max-w-4xl p-4">
				<div className="bg-slate-900/80 rounded-2xl shadow-2xl border border-slate-800 p-6 flex flex-col items-center">
					<h3 className="text-xl font-bold text-white mb-4">
						Hi {userName}. Here&apos;s your generated image:
					</h3>
					<div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-lg bg-slate-800 group">
						{isImageLoading && (
							<div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
								<ImageSpinner />
							</div>
						)}
						<Image
							src={imageUrl}
							alt="Generated art"
							fill
							className="object-contain"
							onLoad={() => setIsImageLoading(false)}
						/>
						<button
							type="button"
							onClick={() => handleDownload(imageUrl)}
							className="group-hover:block hidden cursor-pointer absolute bottom-4 right-4 bg-black/50 p-2 rounded-full hover:bg-black/75 transition-colors"
							aria-label="Download image"
						>
							<DownloadIcon />
						</button>
					</div>
					<button
						type="button"
						onClick={handleCtaClick}
						className="cursor-pointer mt-6 px-8 py-3 font-bold text-white rounded-md bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-100 ease-in-out transform hover:scale-102"
					>
						Generate more in your dashboard 					
						</button>

				</div>
			</div>
		</div>
	);
} 