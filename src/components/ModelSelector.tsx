"use client";

import Image from "next/image";
import { useState } from "react";
import { UpgradePrompt } from "./UpgradePrompt";

const PlusIcon = () => (
	<svg
		className="w-6 h-6 text-slate-400"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
		aria-hidden="true"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M12 4v16m8-8H4"
		/>
	</svg>
);

interface PreTrainedModel {
	id: string;
	name: string;
	image: string;
	type: "pre-trained";
}

interface CustomModel {
	id: string;
	name: string;
	image?: string;
	type: "custom";
	status: string;
	version?: string;
}

export type AvailableModel = PreTrainedModel | CustomModel;

interface ModelSelectorProps {
	models: AvailableModel[];
	selectedModel: AvailableModel | null;
	onModelSelect: (model: AvailableModel) => void;
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
	userId: string;
}

const preTrainedModels: PreTrainedModel[] = [
	{
		id: "tom",
		name: "Tom",
		image: "/tom-placeholder.svg",
		type: "pre-trained",
	},
];

export function ModelSelector({
	models,
	selectedModel,
	onModelSelect,
	modelTrainingEligibility,
	subscriptionData,
	userId,
}: ModelSelectorProps) {
	const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

	const handleAddNewModel = () => {
		if (modelTrainingEligibility.canTrain) {
			// If user can train a new model, scroll to training section
			// For users with no subscription but no models yet, this should work
			// For users with subscription and space for more models, this should also work
			
			// First check if we're on a page that has the training flow
			// If there's no training record yet or user has subscription, they likely see the training flow
			if (!modelTrainingEligibility.hasSubscription && modelTrainingEligibility.currentModelCount === 0) {
				// Basic user with no models - they should see the training flow in NoSubscriptionContent
				// Scroll to the training/upload area
				const trainingSection = document.querySelector('[data-training-section]');
				if (trainingSection) {
					trainingSection.scrollIntoView({ behavior: 'smooth' });
				}
			} else if (modelTrainingEligibility.hasSubscription) {
				// Subscribed user - they should see the training flow in SubscriptionContent
				const trainingSection = document.querySelector('[data-training-section]');
				if (trainingSection) {
					trainingSection.scrollIntoView({ behavior: 'smooth' });
				} else {
					// If no training section is visible, reload the page to show the training UI
					window.location.reload();
				}
			}
		} else {
			// Show upgrade prompt
			setShowUpgradePrompt(true);
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold text-white mb-3">
					Choose a Model
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{models.map((model) => {
						const isSelected =
							selectedModel?.id === model.id &&
							selectedModel?.type === model.type;
						const isDisabled =
							model.type === "custom" && model.status !== "succeeded";

						return (
							<button
								type="button"
								key={`${model.type}-${model.id}`}
								onClick={() => !isDisabled && onModelSelect(model)}
								disabled={isDisabled}
								className={`relative rounded-lg border-2 p-3 transition-all text-left ${
									isSelected
										? "border-indigo-500 ring-2 ring-indigo-500"
										: isDisabled
											? "border-slate-700 opacity-50 cursor-not-allowed"
											: "border-slate-700 hover:border-indigo-600"
								}`}
							>
								<div className="flex items-center space-x-3">
									<div className="relative w-12 h-12 rounded-md overflow-hidden">
										<Image
											src={model.image || "/placeholder1.svg"}
											alt={`${model.name} model`}
											fill
											style={{ objectFit: "cover" }}
										/>
									</div>
									<div className="flex-1">
										<p className="font-medium text-white">{model.name}</p>
										<p className="text-sm text-slate-400">
											{model.type === "pre-trained"
												? "Pre-trained model"
												: model.status === "succeeded"
													? "Your custom model"
													: `Training: ${model.status}`}
										</p>
									</div>
								</div>

								{isSelected && (
									<div className="absolute top-2 right-2">
										<div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
									</div>
								)}
							</button>
						);
					})}

					{/* Add New Model Card */}
					<button
						type="button"
						onClick={handleAddNewModel}
						className="relative rounded-lg border-2 border-dashed border-slate-600 p-3 transition-all text-left hover:border-indigo-500 hover:bg-slate-800/30"
					>
						<div className="flex items-center space-x-3">
							<div className="relative w-12 h-12 rounded-md bg-slate-700 flex items-center justify-center">
								<PlusIcon />
							</div>
							<div className="flex-1">
								<p className="font-medium text-white">Train New Model</p>
								<p className="text-sm text-slate-400">
									{modelTrainingEligibility.canTrain
										? "Create a custom model of yourself"
										: modelTrainingEligibility.hasSubscription
											? `Limit reached (${modelTrainingEligibility.currentModelCount}/${modelTrainingEligibility.maxModels})`
											: "Upgrade to create custom models"
									}
								</p>
							</div>
						</div>
					</button>
				</div>

				{/* Model Count Info */}
				{modelTrainingEligibility.hasSubscription && (
					<div className="mt-3 text-sm text-slate-400">
						Models: {modelTrainingEligibility.currentModelCount}/{modelTrainingEligibility.maxModels} used
					</div>
				)}
			</div>

			{/* Upgrade Prompt Modal */}
			<UpgradePrompt
				isOpen={showUpgradePrompt}
				onClose={() => setShowUpgradePrompt(false)}
				currentPlan={modelTrainingEligibility.planTier}
				currentModelCount={modelTrainingEligibility.currentModelCount}
				maxModels={modelTrainingEligibility.maxModels}
			/>
		</div>
	);
}

export { preTrainedModels };
