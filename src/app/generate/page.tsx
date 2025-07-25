import { GeneratePageClient } from "@/components/GeneratePageClient";
import { NoSubscriptionContent } from "@/components/NoSubscriptionContent";
import { SubscriptionContent } from "@/components/SubscriptionContent";
import { UserMenu } from "@/components/UserMenu";
import { type Plan, PrismaClient } from "@/generated/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "../../../auth";
import { getTrainingRecordByUser, getAllTrainingRecordsByUser } from "../../lib/db";
import { getSubscriptionStatus, canTrainNewModel } from "../../lib/subscription";

const prisma = new PrismaClient();

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

function transformPlan(plan: Plan): TransformedPlan {
	return {
		id: plan.id,
		name: plan.name,
		description: plan.description,
		price: plan.price,
		currency: plan.currency,
		features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
		generations: plan.generations,
		stripePriceId: plan.stripePriceId,
	};
}

async function PageContent() {
	const response = await auth.api.getSession({ headers: await headers() });
	if (!response) {
		redirect("/");
	}
	const { user: sessionUser } = response;

	const user = await prisma.user.findUnique({
		where: { id: sessionUser.id },
	});

	if (!user) {
		redirect("/");
	}

	const trainingRecord = await getTrainingRecordByUser(user.id);
	const allTrainingRecords = await getAllTrainingRecordsByUser(user.id);
	const modelTrainingEligibility = await canTrainNewModel(user.id);

	let subscriptionData = null;
	let plans: TransformedPlan[] = [];

	const subscriptionStatus = await getSubscriptionStatus(user.id);

	if (subscriptionStatus.hasSubscription && subscriptionStatus.subscription) {
		subscriptionData = {
			planName: subscriptionStatus.subscription.planName,
			status: subscriptionStatus.subscription.status,
			generationsUsed: subscriptionStatus.subscription.generationsUsed,
			generationsLimit: subscriptionStatus.subscription.generationsLimit,
			generationsRemaining: subscriptionStatus.generationsRemaining,
			cancelAtPeriodEnd: subscriptionStatus.subscription.cancelAtPeriodEnd,
			currentPeriodEnd: subscriptionStatus.subscription.currentPeriodEnd,
		};
	} else {
		try {
			const dbPlans = await prisma.plan.findMany({
				orderBy: {
					price: "asc",
				},
			});
			plans = dbPlans.map(transformPlan);
		} catch (planError) {
			console.error("Error fetching plans:", planError);
		}
	}

	return (
		<div className="relative min-h-screen bg-slate-950 text-white">
			<header className="fixed top-1 left-0 right-0 z-20 ">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
					<div className="flex h-16 items-center justify-end">
						<UserMenu
							user={user}
							currentPage="dashboard"
							subscription={
								subscriptionData
									? {
											planName: subscriptionData.planName,
											status: subscriptionData.status,
										}
									: null
							}
						/>
					</div>
				</div>
			</header>
			<main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
				<div className="mx-auto w-full max-w-7xl h-screen flex flex-col justify-center">
					<div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-sm">
						<div className="px-4 p-6 pt-2 sm:p-8 sm:pt-2 lg:p-10 lg:pt-2">
							{subscriptionData ? (
								<SubscriptionContent
									user={user}
									trainingRecord={trainingRecord}
									allTrainingRecords={allTrainingRecords}
									modelTrainingEligibility={modelTrainingEligibility}
									subscriptionData={subscriptionData}
								/>
							) : (
								<NoSubscriptionContent 
									user={user} 
									plans={plans} 
									trainingRecord={trainingRecord}
									modelTrainingEligibility={modelTrainingEligibility}
								/>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

export default function GeneratePage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<GeneratePageClient>
				<PageContent />
			</GeneratePageClient>
		</Suspense>
	);
}
