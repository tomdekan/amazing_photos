"use client";

import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { IconLogo, Spinner } from "./icon-components";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/generate",
    });
    // No need to set isLoading back to false, as the page will redirect.
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <IconLogo />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Generate for Free</h2>
            <p className="text-slate-400 mb-6">
              Just sign in with your Google account to start creating your first AI photos.
            </p>

            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovering(true)}
                onHoverEnd={() => setIsHovering(false)}
                className="inline-block"
              >
                <button
									onClick={handleLogin}
									disabled={isLoading}
									type="button"
									className="group relative flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-lg font-medium text-gray-900 shadow-lg transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
								>
									{isLoading ? (
										<>
											<Spinner />
											<span>Signing in...</span>
										</>
									) : (
										<>
											<motion.div
												className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600"
												initial={{ x: "-100%" }}
												animate={{ x: isHovering ? "0%" : "-100%" }}
												transition={{ duration: 0.3 }}
											/>

											<motion.span className="relative z-10 text-gray-900 group-hover:text-white transition-colors duration-300">
												Sign in with Google
											</motion.span>

											<motion.svg
												xmlns="http://www.w3.org/2000/svg"
												className="relative z-10 h-5 w-5 text-gray-900 group-hover:text-white transition-colors duration-300"
												viewBox="0 0 24 24"
												initial={{ rotate: 0 }}
												animate={{ rotate: isHovering ? 360 : 0 }}
												transition={{ duration: 0.5 }}
												aria-labelledby="googleIconTitle"
											>
												<title id="googleIconTitle">Google G Logo</title>
												<path
													fill="currentColor"
													d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
												/>
												<path
													fill="currentColor"
													d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
												/>
												<path
													fill="currentColor"
													d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
												/>
												<path
													fill="currentColor"
													d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
												/>
											</motion.svg>
										</>
									)}
								</button>
              </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 