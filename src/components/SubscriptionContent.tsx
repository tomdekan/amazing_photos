import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { ModelBasedGeneration } from "@/components/ModelBasedGeneration";
import { TrainingRecord } from "@/generated/prisma";

type User = {
	id: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
};

interface SubscriptionData {
	planName: string;
	status: string;
	generationsUsed: number;
	generationsLimit: number;
	generationsRemaining: number;
	cancelAtPeriodEnd: boolean;
	currentPeriodEnd: Date;
}

interface SubscriptionContentProps {
	user: User;
	trainingRecord: TrainingRecord | null;
	subscriptionData: SubscriptionData;
}

export function SubscriptionContent({
	user,
	trainingRecord,
	subscriptionData,
}: SubscriptionContentProps) {
	return (
			<div className="mt-8">
				<ModelBasedGeneration
					user={user}
					hasSubscription
					trainingRecord={trainingRecord}
				/>
			</div>
	);
}
