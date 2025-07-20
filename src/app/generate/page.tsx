import { UserMenu } from "@/components/UserMenu";
import { type Plan, PrismaClient } from "@/generated/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "../../../auth";
import { NoSubscriptionContent } from "@/components/NoSubscriptionContent";
import { SubscriptionContent } from "@/components/SubscriptionContent";
import { GeneratePageClient } from "@/components/GeneratePageClient";
import { getSubscriptionStatus } from "../../lib/subscription";
import { getTrainingRecordByUser } from "../../lib/db";

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
		redirect("/sign-in");
	}
	const { user } = response;

	const trainingRecord = await getTrainingRecordByUser(user.id);

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
			<header className="fixed top-0 left-0 right-0 z-20 bg-slate-950/80 backdrop-blur-md">
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
			<main className="pt-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
				<div className="mx-auto w-full max-w-7xl">
					<div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-sm">
						<div className="px-6 py-8 sm:p-10 lg:p-12">
							{subscriptionData ? (
								<SubscriptionContent
									user={user}
									trainingRecord={trainingRecord}
									subscriptionData={subscriptionData}
								/>
							) : (
								<NoSubscriptionContent
									user={user}
									plans={plans}
									session={response}
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
