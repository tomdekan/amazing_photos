"use client";

import { useEffect, useState } from "react";

interface TrainingTimerProps {
	startTime: string | Date;
	durationMinutes: number;
}

function formatDuration(seconds: number): string {
	if (seconds < 0) return "0m 0s";
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.round(seconds % 60);
	return `${minutes}m ${remainingSeconds}s`;
}

export function TrainingTimer({
	startTime,
	durationMinutes,
}: TrainingTimerProps) {
	const [remaining, setRemaining] = useState("");

	useEffect(() => {
		const calculateRemaining = () => {
			const start = new Date(startTime);
			const now = new Date();
			const elapsed = (now.getTime() - start.getTime()) / 1000;
			const totalDuration = durationMinutes * 60;
			const remainingSeconds = totalDuration - elapsed;

			if (remainingSeconds > 0) {
				setRemaining(formatDuration(remainingSeconds));
			} else {
				setRemaining("Almost done...");
			}
		};

		calculateRemaining();
		const interval = setInterval(calculateRemaining, 1000);

		return () => clearInterval(interval);
	}, [startTime, durationMinutes]);

	return <span className="text-xs text-slate-400">{remaining}</span>;
} 