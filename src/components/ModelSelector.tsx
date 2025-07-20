"use client";

import Image from "next/image";

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
}

const preTrainedModels: PreTrainedModel[] = [
	{
		id: "tom",
		name: "Tom",
		image: "/tom-placeholder.svg",
		type: "pre-trained",
	},
	{
		id: "henry",
		name: "Henry",
		image: "/henry-placeholder.svg",
		type: "pre-trained",
	},
];

export function ModelSelector({
	models,
	selectedModel,
	onModelSelect,
}: ModelSelectorProps) {
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
				</div>
			</div>
		</div>
	);
}

export { preTrainedModels };
