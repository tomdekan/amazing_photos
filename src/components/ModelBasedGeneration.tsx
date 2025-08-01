"use client";

import type { TrainingRecord, User } from "@/generated/prisma";
import { useCallback, useEffect, useState } from "react";
import { GenerationForm } from "./GenerationForm";
import { ImageGallery } from "./ImageGallery";
import {
	type AvailableModel,
	ModelSelector,
	preTrainedModels,
} from "./ModelSelector";

interface ModelBasedGenerationProps {
	user: User;
	hasSubscription: boolean;
	trainingRecord: TrainingRecord | null;
	allTrainingRecords: TrainingRecord[];
	modelTrainingEligibility: {
		canTrain: boolean;
		hasSubscription: boolean;
		currentModelCount: number;
		maxModels: number;
		planTier: 'basic' | 'pro' | 'unknown';
		reason?: string;
	};
	subscriptionData: {
		planName: string;
		status: string;
		generationsUsed: number;
		generationsLimit: number;
		generationsRemaining: number;
		cancelAtPeriodEnd: boolean;
		currentPeriodEnd: Date;
	} | null;
}

export function ModelBasedGeneration({
	user,
	hasSubscription,
	trainingRecord,
	allTrainingRecords,
	modelTrainingEligibility,
	subscriptionData,
}: ModelBasedGenerationProps) {
	const [selectedModel, setSelectedModel] = useState<AvailableModel | null>(
		null,
	);
	const [galleryKey, setGalleryKey] = useState(0);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationPrompt, setGenerationPrompt] = useState("");
	const [timer, setTimer] = useState(0);

	useEffect(() => {
		let interval: NodeJS.Timeout | undefined;

		if (isGenerating) {
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
	}, [isGenerating]);

	const availableModels: AvailableModel[] = [
		...preTrainedModels,
		...allTrainingRecords.map((training) => ({
			id: training.id,
			name: user.name ?? "Your Custom Model",
			type: "custom" as const,
			status: training.status,
			version: training.version ?? undefined,
			createdAt: training.createdAt.toISOString(),
		})),
	];

	if (!selectedModel && availableModels.length > 0) {
		setSelectedModel(availableModels[0]);
	}

	const handleModelSelect = (model: AvailableModel) => {
		setSelectedModel(model);
	};

	const handleImageGenerated = useCallback(() => {
		setGalleryKey((prev) => prev + 1);
	}, []);

	const handleGenerate = async (prompt: string) => {
		if (!selectedModel) return;

		setGenerationPrompt(prompt);
		setIsGenerating(true);

		try {
			let endpoint = "";
			const body: { prompt: string; model?: string } = { prompt };

			if (selectedModel.type === "pre-trained") {
				endpoint = "/api/generate/free";
				body.model = selectedModel.id;
			} else {
				if (!hasSubscription) {
					throw new Error("Subscription required for custom models");
				}
				endpoint = "/api/generate";
			}

			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to generate image");
			}

			handleImageGenerated();
		} catch (err) {
			console.error("Generation failed:", err);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div className="space-y-6">
				<ModelSelector
					models={availableModels}
					selectedModel={selectedModel}
					onModelSelect={handleModelSelect}
					modelTrainingEligibility={modelTrainingEligibility}
					subscriptionData={subscriptionData}
					userId={user.id}
				/>

				<GenerationForm
					selectedModel={selectedModel}
					hasSubscription={hasSubscription}
					isGenerating={isGenerating}
					onGenerate={handleGenerate}
				/>
			</div>

			<div>
				<ImageGallery
					key={galleryKey}
					selectedModel={selectedModel}
					userId={user.id}
					isGenerating={isGenerating}
					generationPrompt={generationPrompt}
					generationTimer={timer}
				/>
			</div>
		</div>
	);
}
