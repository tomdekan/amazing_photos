"use client";

import { motion } from "framer-motion";
import { Loader, Check, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Spinner } from "./icon-components";

interface Step {
	name: string;
	status: "pending" | "running" | "completed";
}

const steps: Step[] = [
	{ name: "Finalizing uploads", status: "pending" },
	{ name: "Preparing AI model", status: "pending" },
	{ name: "Initiating training", status: "pending" },
];

export function TrainingInitiation() {
	const [currentSteps, setCurrentSteps] = useState<Step[]>(steps);

	useEffect(() => {
		const timeouts: NodeJS.Timeout[] = [];
		const runSteps = () => {
			let delay = 0;
			steps.forEach((_, index) => {
				// Start running
				timeouts.push(
					setTimeout(() => {
						setCurrentSteps((prev) =>
							prev.map((s, i) => (i === index ? { ...s, status: "running" } : s)),
						);
					}, delay),
				);

				delay += 6000 + Math.random() * 1500;

				// Mark as completed
				timeouts.push(
					setTimeout(() => {
						setCurrentSteps((prev) =>
							prev.map((s, i) =>
								i === index ? { ...s, status: "completed" } : s,
							),
						);
					}, delay),
				);
			});
		};

		runSteps();

		return () => {
			timeouts.forEach(clearTimeout);
		};
	}, []);

	return (
		<div className="w-full text-center p-8 bg-slate-800/50 rounded-lg border border-slate-700">
			<h3 className="text-xl font-bold text-white mb-6">
				Launching Your Training...
			</h3>
			<div className="space-y-4 max-w-sm mx-auto">
				{currentSteps.map((step, index) => (
					<motion.div
						key={step.name}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className="flex items-center space-x-4 p-3 bg-slate-700/50 rounded-lg"
					>
						<div className="w-6 h-6">
							{step.status === "pending" && (
								<div className="w-5 h-5 border-2 border-slate-500 rounded-full" />
							)}
							{step.status === "running" && (
								<Loader className="w-5 h-5 text-indigo-400 animate-spin" />
							)}
							{step.status === "completed" && (
								<Check className="w-5 h-5 text-green-400" />
							)}
						</div>
						<p className="text-slate-300 flex-1 text-left">{step.name}</p>
					</motion.div>
				))}
			</div>
			<div className="flex flex-col gap-2">
				<p className="text-sm text-slate-500 mt-6">
					This should only take a moment. Please don't close this window.
				</p>
				<Spinner />
			</div>
		</div>
	);
} 