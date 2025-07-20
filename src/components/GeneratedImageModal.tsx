"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface GeneratedImageModalProps {
	isOpen: boolean;
	onClose: () => void;
	imageUrl: string;
}

export function GeneratedImageModal({ isOpen, onClose, imageUrl }: GeneratedImageModalProps) {
	const router = useRouter();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.body.style.overflow = "hidden";
			document.addEventListener("keydown", handleKeyDown);
		} else {
			document.body.style.overflow = "auto";
		}

		return () => {
			document.body.style.overflow = "auto";
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleGenerateMore = () => {
		onClose();
		router.push("/generate");
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Enter" && onClose()}
		>
			<div
				className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md m-4 p-8 text-center"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
				role="document"
			>
				<h3 className="text-2xl font-bold mb-4">Your Generated Image</h3>
				<div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-700 mb-6">
					<Image
						src={imageUrl}
						alt="Generated image"
						fill
						style={{ objectFit: "cover" }}
					/>
				</div>
				<p className="text-slate-300 mb-6">
					Like what you see? Create a custom model to generate photos of
					yourself.
				</p>
				<button
					type="button"
					onClick={handleGenerateMore}
					className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
				>
					Generate More Images
				</button>
			</div>
		</div>
	);
} 