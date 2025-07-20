"use client";

import { motion } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function UnlockPlanPrompt() {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center p-4">
			<motion.div
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
                onClick={() => {
                    window.location.href = "#pricing-plans";
                }}
				className="w-full max-w-md text-center p-8 bg-slate-800/80 border border-slate-700 rounded-xl shadow-2xl overflow-hidden cursor-pointer"
			>
				<motion.div
					animate={{
						y: [0, -5, 0, 5, 0],
						transition: {
							duration: 3,
							repeat: Infinity,
							ease: "easeInOut",
						},
					}}
				>
					<motion.div
						initial={false}
						animate={{ rotate: isHovered ? 0 : -10 }}
						transition={{ type: "spring", stiffness: 200, damping: 15 }}
					>
						{isHovered ? (
							<Unlock className="h-12 w-12 mx-auto text-green-400" />
						) : (
							<Lock className="h-12 w-12 mx-auto text-indigo-400" />
						)}
					</motion.div>
				</motion.div>

				<h3 className="text-white font-bold text-2xl mt-6">
					Unlock to generate images of you!
				</h3>
				<p className="text-slate-300 mt-2 max-w-xs mx-auto">
					Choose a plan to train a personalized AI model with your photos.
				</p>

				<Link href="#pricing-plans">
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="mt-6 inline-block bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
					>
						Choose a Plan
					</motion.button>
				</Link>
			</motion.div>
		</div>
	);
} 