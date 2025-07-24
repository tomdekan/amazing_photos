"use client";

import { useState } from "react";
import type { AvailableModel } from "./ModelSelector";

interface GenerationFormProps {
	selectedModel: AvailableModel | null;
	hasSubscription: boolean;
	isGenerating: boolean;
	onGenerate: (prompt: string) => void;
}

export function GenerationForm({
	selectedModel,
	hasSubscription,
	isGenerating,
	onGenerate,
}: GenerationFormProps) {
	const [prompt, setPrompt] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!selectedModel) {
			setError("Please select a model first");
			return;
		}

		if (!prompt.trim()) {
			setError("Please enter a prompt");
			return;
		}

		setError(null);
		onGenerate(prompt);
		setPrompt("");
	};

	if (!selectedModel) {
		return (
			<div className="bg-slate-800/30 rounded-lg border border-slate-700 p-6 text-center">
				<p className="text-slate-400">Select a model to start generating images</p>
			</div>
		);
	}

	const requiresSubscription =
		selectedModel.type === "custom" && !hasSubscription;

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold text-white mb-3">
					Generate with {selectedModel.name}
				</h3>

				{requiresSubscription && (
					<div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 mb-4">
						<p className="text-amber-200 text-sm">
							A subscription is required to generate images with your custom
							model.
						</p>
					</div>
				)}
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="prompt"
						className="block text-sm font-medium text-slate-400 mb-2"
					>
						Describe what you want to generate
						<p>
						
</p>
					</label>
					<textarea
						id="prompt"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						placeholder={`e.g., "a photo of TOK at the beach during sunset" (Use the word "TOK" to refer to the person you are generating)`}
						className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
						rows={3}
						disabled={isGenerating || requiresSubscription}
					/>
				</div>

				{error && (
					<div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
						<p className="text-red-200 text-sm">{error}</p>
					</div>
				)}

				<button
					type="submit"
					disabled={isGenerating || !prompt.trim() || requiresSubscription}
					className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
				>
					{isGenerating ? (
						<>
							<div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
							<span>Generating...</span>
						</>
					) : (
						<span>Generate Image</span>
					)}
				</button>
			</form>

			{selectedModel.type === "pre-trained" && (
				<div className="text-xs text-slate-500 text-center">
					Free generations remaining
				</div>
			)}
		</div>
	);
}
