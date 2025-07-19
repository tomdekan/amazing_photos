"use client";

import type { Session } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
	onClose: () => void;
	session: Session | null;
}

export default function GeneratedImageDisplay({
	imageUrl,
	onClose,
	session,
}: GeneratedImageDisplayProps) {
	const router = useRouter();
	if (!imageUrl) return null;

	const userName = session?.user?.name?.split(" ")[0] || "there";

	const handleCtaClick = () => {
		router.push("/");
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
			<div className="relative w-full max-w-4xl p-4">
				<div className="bg-slate-900/80 rounded-2xl shadow-2xl border border-slate-800 p-6 flex flex-col items-center">
					<h3 className="text-xl font-bold text-white mb-4">
						Hi {userName}. Here's your generated image:
					</h3>
					<div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-lg bg-slate-800">
						<img
							src={imageUrl}
							alt="Generated art"
							className="object-contain w-full h-full"
						/>
						<button
							type="button"
							onClick={() => handleDownload(imageUrl)}
							className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-full hover:bg-black/75 transition-colors"
							aria-label="Download image"
						>
							<DownloadIcon />
						</button>
					</div>
					<button
						type="button"
						onClick={handleCtaClick}
						className="mt-6 px-8 py-3 font-bold text-white rounded-md bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform hover:scale-105"
					>
						Explore Your Dashboard
					</button>
					<button
						type="button"
						onClick={onClose}
						className="mt-4 text-sm text-slate-400 hover:text-white"
					>
						Or generate another one
					</button>
				</div>
			</div>
		</div>
	);
} 