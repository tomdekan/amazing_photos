"use client";

import type { Session } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import LoginModal from "./LoginModal";
import GeneratedImageDisplay from "./GeneratedImageDisplay";

// Match the placeholder models from the backend
const models = [{ id: "Tom", name: "Tom" }];

const Spinner = () => (
	<svg
		className="animate-spin h-5 w-5 text-white mr-3"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		role="img"
		aria-labelledby="spinner-title"
	>
		<title id="spinner-title">Loading...</title>
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
	const [timer, setTimer] = useState(0);

	useEffect(() => {
		let interval: NodeJS.Timeout | undefined;

		if (isLoading) {
			setTimer(0);
			interval = setInterval(() => {
				setTimer((prevTimer) => prevTimer + 0.1);
			}, 100);
		}

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [isLoading]);

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
			<div className="flex w-full justify-center items-start gap-8">
				{generatedImage && (
					<GeneratedImageDisplay
						imageUrl={generatedImage}
						session={session}
					/>
				)}
				<div
					className={`w-full max-w-md p-8 space-y-6 bg-slate-900/70 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-sm transition-all duration-500 ${
						generatedImage ? "ml-auto" : "mx-auto"
					}`}
				>
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
								What do you want in the image?
							</label>
							<textarea
								id="prompt-input"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
										e.preventDefault(); // prevent new line
										handleSubmit(
											e as unknown as React.FormEvent<HTMLFormElement>,
										);
									}
								}}
								placeholder="e.g., a portrait in the style of Rembrandt"
								className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								rows={3}
								required
							/>
						</div>
						<button
							type="submit"
							disabled={isLoading}
							className="w-full flex items-center justify-center px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<>
									<Spinner />
									<span>Generating... {timer.toFixed(1)}s</span>
								</>
							) : (
								"Generate Image"
							)}
						</button>
						{isLoading && (
							<p className="text-xs text-center text-slate-400 mt-2">
								Generating normally takes less than 45 secs
							</p>
						)}
					</form>
					{error && <p className="mt-4 text-center text-red-500">{error}</p>}
				</div>
			</div>
		</>
	);
}
