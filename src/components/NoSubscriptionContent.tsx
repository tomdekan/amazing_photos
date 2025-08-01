"use client";

import { GenerateFlow } from "@/components/GenerateFlow";
import { ModelBasedGeneration } from "@/components/ModelBasedGeneration";
import PricingCard from "@/components/PricingCard";
import { UnlockPlanPrompt } from "@/components/UnlockPlanPrompt";
import type { TrainingRecord, User } from "@/generated/prisma";
import Link from "next/link";

interface TransformedPlan {
	id: string;
	name: string;
	description: string;
	price: number;
	currency: string;
	features: string[];
	generations: number;
	stripePriceId: string;
}

interface NoSubscriptionContentProps {
	user: User;
	plans: TransformedPlan[];
	trainingRecord: TrainingRecord | null;
	modelTrainingEligibility: {
		canTrain: boolean;
		hasSubscription: boolean;
		currentModelCount: number;
		maxModels: number;
		planTier: "basic" | "pro" | "unknown";
		reason?: string;
	};
}

export function NoSubscriptionContent({
	user,
	plans,
	trainingRecord,
	modelTrainingEligibility,
}: NoSubscriptionContentProps) {
	return (
		<div className="space-y-8">
			{/* Free Generation Section */}
			<div>
				<div className="text-center mb-6">
					<h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Generate free images
					</h2>
					<p className="mt-4 text-lg text-slate-300">
						Try our pre-trained models for free, or{" "}
						<Link
							href="#pricing-plans"
							className="text-indigo-400 hover:text-indigo-300"
						>
							subscribe to a plan
						</Link>{" "}
						to create images of yourself
					</p>
				</div>

				<ModelBasedGeneration
					user={user}
					hasSubscription={false}
					trainingRecord={trainingRecord}
					allTrainingRecords={trainingRecord ? [trainingRecord] : []}
					modelTrainingEligibility={modelTrainingEligibility}
					subscriptionData={null}
				/>
			</div>

			{/* Training Section for Basic Users */}
			<div
				className="relative pt-8 border-t border-slate-800"
				data-training-section
			>
				<UnlockPlanPrompt />
				<div className="opacity-20 pointer-events-none">
					<div className="text-center mb-8">
						<h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
							Train your first model
						</h2>
						<p className="mt-4 text-lg text-slate-300">
							Upload photos of yourself to create a personalized AI model
						</p>
					</div>

					<GenerateFlow user={user} trainingRecord={trainingRecord} />
				</div>
			</div>

			{/* Pricing Section */}
			<div className="pt-8 border-t border-slate-800">
				<div className="text-center mb-8">
					<h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Start generating photos of you!
					</h2>
					<p className="mt-4 text-lg text-slate-300">
						Choose a plan to train a custom model with your photos
					</p>
				</div>

				<div
					id="pricing-plans"
					className="grid grid-cols-1 gap-8 mt-10 md:grid-cols-2 max-w-4xl mx-auto"
				>
					{plans.map((plan, index) => (
						<PricingCard
							key={plan.id}
							plan={plan}
							isPopular={index === 1}
							userId={user.id}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
