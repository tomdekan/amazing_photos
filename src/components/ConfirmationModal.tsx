"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Rocket } from "lucide-react";

interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isLoading: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
}

export function ConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	isLoading,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
}: ConfirmationModalProps) {
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.95, y: -20 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0.95, y: 20, opacity: 0 }}
						transition={{ type: "spring", stiffness: 300, damping: 25 }}
						className="relative bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md text-center"
						onClick={(e) => e.stopPropagation()}
					>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{
								delay: 0.2,
								type: "spring",
								stiffness: 400,
								damping: 10,
							}}
							className="mx-auto bg-indigo-500/20 text-indigo-400 rounded-full h-16 w-16 flex items-center justify-center"
						>
							<motion.div
								animate={{
									rotate: [0, 5, -5, 5, 0],
									y: [0, -4, 0],
								}}
								transition={{
									rotate: {
										delay: 0.3,
										duration: 0.5,
										ease: "easeInOut",
									},
									y: {
										delay: 0.8,
										duration: 2,
										repeat: Infinity,
										repeatType: "reverse",
										ease: "easeInOut",
									},
								}}
							>
								<Rocket className="h-8 w-8" />
							</motion.div>
						</motion.div>

						<h3 className="text-xl font-bold text-white mt-6">{title}</h3>
						<p className="text-slate-400 mt-2">{message}</p>

						<div className="flex justify-center gap-4 mt-8">
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={onClose}
								disabled={isLoading}
								className="px-6 py-2 font-semibold text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
							>
								{cancelText}
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={onConfirm}
								disabled={isLoading}
								className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-indigo-400/50"
							>
								{isLoading ? (
									<div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin mx-auto" />
								) : (
									confirmText
								)}
							</motion.button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
} 