"use client";

import { X } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
	isOpen: boolean;
	onClose: () => void;
	currentPlan: string;
	currentModelCount: number;
	maxModels: number;
}

export function UpgradePrompt({
	isOpen,
	onClose,
	currentPlan,
	currentModelCount,
	maxModels,
}: UpgradePromptProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<button
				type="button"
				className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
				onClick={onClose}
				aria-label="Close modal"
			/>
			
			{/* Modal */}
			<div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
				>
					<X className="h-5 w-5" />
				</button>

				{/* Content */}
				<div className="space-y-4">
					<div className="text-center">
						<h3 className="text-xl font-semibold text-white mb-2">
							Upgrade Required
						</h3>
						<div className="text-slate-300 space-y-2">
							<p>
								You've reached your {currentPlan} plan limit of {maxModels} model{maxModels > 1 ? 's' : ''}.
							</p>
							<p>
								Currently using: {currentModelCount}/{maxModels} models
							</p>
						</div>
					</div>

					<div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
						<h4 className="font-medium text-white mb-2">Upgrade to Pro to get:</h4>
						<ul className="text-sm text-slate-300 space-y-1">
							<li>• 3 AI models of people</li>
							<li>• 250 AI photo generations monthly</li>
							<li>• Priority email support</li>
						</ul>
					</div>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
						>
							Maybe Later
						</button>
						<Link
							href="/pricing"
							className="flex-1 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors text-center font-medium"
						>
							Upgrade Plan
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}