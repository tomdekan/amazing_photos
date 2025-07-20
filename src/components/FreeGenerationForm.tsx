"use client";

import type { Session } from "@/lib/auth-client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { GeneratedImageModal } from "./GeneratedImageModal";
import LoginModal from "./LoginModal";

const models = [
	{
		id: "tom",
		name: "Tom",
		image: "/tom-placeholder.svg",
	},
	{
		id: "tom", // This still routes to the "tom" model on the backend
		name: "Henry",
		image: "/henry-placeholder.svg",
	},
];

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
	const [selectedModelName, setSelectedModelName] = useState(models[0].name);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [generatedImage, setGeneratedImage] = useState<string | null>(null);
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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
			setIsImageModalOpen(true);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleModelChange = (modelId: string, modelName: string) => {
		setSelectedModel(modelId);
		setSelectedModelName(modelName);
		setGeneratedImage(null);
		setError(null);
	};

	return (
		<>
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>
			{generatedImage && (
				<GeneratedImageModal
					isOpen={isImageModalOpen}
					onClose={() => setIsImageModalOpen(false)}
					imageUrl={generatedImage}
				/>
			)}
			<div className="bg-slate-900/70 rounded-2xl p-6 md:p-8 border border-slate-800 backdrop-blur-sm max-w-2xl mx-auto">
				<form onSubmit={handleSubmit} className="space-y-6">
					<fieldset>
						<legend className="block text-sm font-medium text-slate-400 text-left mb-2">
							Choose a Model
						</legend>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{models.map((model, index) => (
								<label
									key={`${model.id}-${index}`}
									className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
										selectedModel === model.id
											? "border-indigo-500 ring-2 ring-indigo-500"
											: "border-slate-700 hover:border-indigo-600"
									}`}
								>
									<input
										type="radio"
										name="model"
										value={model.id}
										checked={selectedModel === model.id}
										onChange={() => handleModelChange(model.id, model.name)}
										className="sr-only"
									/>
									<div className="flex items-center space-x-3">
										<div className="relative w-12 h-12 rounded-md overflow-hidden">
											<Image
												src={model.image}
												alt={`Image of ${model.name}`}
												fill
												style={{ objectFit: "cover" }}
											/>
										</div>
										<p className="font-medium text-white">{model.name}</p>
									</div>
								</label>
							))}
						</div>
					</fieldset>

					<div>
						<label
							htmlFor="prompt"
							className="block text-sm font-medium text-slate-400 text-left mb-2"
						>
							Enter a Prompt
						</label>
						<textarea
							id="prompt"
							rows={3}
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
							placeholder={`e.g., "a photo of ${selectedModelName} at the beach"`}
							disabled={isLoading}
						/>
					</div>

					{error && (
						<div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
							<p className="text-red-300 text-sm text-center">{error}</p>
						</div>
					)}

					<button
						type="submit"
						disabled={isLoading || !prompt.trim()}
						className="w-full text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
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
				</form>
			</div>
		</>
	);
}
