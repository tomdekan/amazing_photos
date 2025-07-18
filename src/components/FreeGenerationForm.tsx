"use client";

import type { Session } from "@/lib/auth-client";
import { useState } from "react";
import LoginModal from "./LoginModal";

// Match the placeholder models from the backend
const models = [
	{ id: "historical-figure-1", name: "Historical Figure 1" },
	{ id: "historical-figure-2", name: "Historical Figure 2" },
	{ id: "art-style-1", name: "Art Style 1" },
];

export default function FreeGenerationForm({
	session,
}: {
	session: Session | null;
}) {
	const [prompt, setPrompt] = useState("");
	const [selectedModel, setSelectedModel] = useState(models[0].id);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [generatedImage, setGeneratedImage] = useState<string | null>(null);
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!session) {
			setIsLoginModalOpen(true);
			return;
		}

		setIsLoading(true);
		setError(null);
		setGeneratedImage(null);

		try {
			const response = await fetch("/api/generate/free", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt, model: selectedModel }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to generate image");
			}

			const data = await response.json();
			setGeneratedImage(data.imageUrl);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>
			<div className="w-full max-w-md mx-auto p-8 space-y-6 bg-slate-900/70 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-sm">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-white">Try it for Free</h2>
					<p className="text-slate-400">
						Generate a free image using one of our pre-trained models.
					</p>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="model-select"
							className="block text-sm font-medium text-slate-400 text-left"
						>
							Choose a Model
						</label>
						<select
							id="model-select"
							value={selectedModel}
							onChange={(e) => setSelectedModel(e.target.value)}
							className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						>
							{models.map((model) => (
								<option key={model.id} value={model.id}>
									{model.name}
								</option>
							))}
						</select>
					</div>
					<div>
						<label
							htmlFor="prompt-input"
							className="block text-sm font-medium text-slate-400 text-left"
						>
							Enter a Prompt
						</label>
						<textarea
							id="prompt-input"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder="e.g., a portrait in the style of Rembrandt"
							className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							rows={3}
							required
						/>
					</div>
					<button
						type="submit"
						disabled={isLoading}
						className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed"
					>
						{isLoading ? "Generating..." : "Generate Image"}
					</button>
				</form>
				{error && <p className="mt-4 text-center text-red-500">{error}</p>}
				{generatedImage && (
					<div className="mt-6">
						<h3 className="text-lg font-medium text-white text-center">
							Your Generated Image:
						</h3>
						<div className="mt-2 aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-slate-800">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={generatedImage}
								alt="Generated art"
								className="object-cover w-full h-full"
							/>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
