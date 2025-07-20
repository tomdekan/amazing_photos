import { GenerateFlow } from "@/components/GenerateFlow";
import { ModelBasedGeneration } from "@/components/ModelBasedGeneration";
import type { TrainingRecord, User } from "@/generated/prisma";

interface SubscriptionContentProps {
	user: User;
	trainingRecord: TrainingRecord | null;
	allTrainingRecords: TrainingRecord[];
	modelTrainingEligibility: {
		canTrain: boolean;
		hasSubscription: boolean;
		currentModelCount: number;
		maxModels: number;
		planTier: "basic" | "pro" | "unknown";
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
	};
}

export function SubscriptionContent({
	user,
	trainingRecord,
	allTrainingRecords,
	modelTrainingEligibility,
	subscriptionData,
}: SubscriptionContentProps) {
	// Show training flow for subscribed users who can train more models
	const showTrainingFlow =
		modelTrainingEligibility.canTrain &&
		modelTrainingEligibility.hasSubscription;

	return (
		<div className="space-y-8">
			{/* Main Generation Interface */}
			<div>
				<ModelBasedGeneration
					user={user}
					hasSubscription={true}
					trainingRecord={trainingRecord}
					allTrainingRecords={allTrainingRecords}
					modelTrainingEligibility={modelTrainingEligibility}
					subscriptionData={subscriptionData}
				/>
			</div>

			{/* Training Section for Additional Models */}
			{showTrainingFlow && (
				<div className="pt-8 border-t border-slate-800" data-training-section>
					<div className="text-center mb-8">
						<h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
							Train a new model
						</h2>
						<p className="mt-4 text-lg text-slate-300">
							Create another personalized AI model (
							{modelTrainingEligibility.currentModelCount + 1}/
							{modelTrainingEligibility.maxModels})
						</p>
					</div>

					<GenerateFlow user={user} trainingRecord={null} />
				</div>
			)}
		</div>
	);
}
