import { ModelBasedGeneration } from "@/components/ModelBasedGeneration";
import { type TrainingRecord, type User } from "@/generated/prisma";


interface SubscriptionContentProps {
	user: User;
	trainingRecord: TrainingRecord | null;
}

export function SubscriptionContent({
	user,
	trainingRecord,
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
