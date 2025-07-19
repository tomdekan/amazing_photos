"use client";

import { authClient, Session } from "@/lib/auth-client";
import {
    motion,
    useAnimate,
    useInView,
    useScroll,
    useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import FreeGenerationForm from "@/components/FreeGenerationForm";
import { IconLogo } from "@/components/icon-components";
import { SignOutButton } from "@/components/SignOutButton";
import LoginModal from "@/components/LoginModal";

export default function Home() {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

	useEffect(() => {
		authClient.getSession().then(({ data }) => setSession(data));
	}, []);

	const images1 = [
		{ id: "p1-1", src: "/placeholder1.svg" },
		{ id: "p1-2", src: "/placeholder3.svg" },
		{ id: "p1-3", src: "/placeholder2.svg" },
		{ id: "p1-4", src: "/placeholder1.svg" },
	];

	const images2 = [
		{ id: "p2-1", src: "/placeholder2.svg" },
		{ id: "p2-2", src: "/placeholder1.svg" },
		{ id: "p2-3", src: "/placeholder3.svg" },
		{ id: "p2-4", src: "/placeholder2.svg" },
	];

	return (
		<div className="min-h-screen bg-slate-950 text-white flex flex-col">
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>
			<main className="grid lg:grid-cols-2 flex-grow">
				{/* Left side: Content and Form */}
				<div className="flex flex-col items-center justify-center px-8 relative">
					<Header
						session={session}
						onSignInClick={() => setIsLoginModalOpen(true)}
					/>
					<div className="max-w-md w-full">
						<div className="text-center mb-10">
							<h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
								A Perfect Photo of You, 
							</h1>
							<h2 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mt-2">
								Generated in Seconds.
							</h2>
							<p className="mt-6 text-lg text-slate-300 max-w-xl mx-auto">
								Try it out with our pre-trained models below. Sign in to generate photos of yourself.
							</p>
						</div>

						<FreeGenerationForm session={session} />
					</div>
				</div>

				{/* Right side: Image showcase */}
				<div className="hidden lg:block relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-950">
					<div className="absolute inset-0 grid grid-cols-2 gap-4 px-2">
						<ImageColumn images={images1} animationClass="animate-scroll-up" />
						<ImageColumn images={images2} animationClass="animate-scroll-down" />
					</div>
				</div>

				<a
					href="https://tomdekan.com"
					target="_blank"
					rel="noopener noreferrer"
					className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-black/20 text-white/50 text-xs font-semibold rounded-full backdrop-blur-sm hover:text-white/80 transition-colors"
				>
					Made by Tom Dekan
				</a>
			</main>
		</div>
	);
};

const Header = ({
	session,
	onSignInClick,
}: {
	session: Session | null;
	onSignInClick: () => void;
}) => (
	<header className="z-50 w-full max-w-md mb-8">
		<nav
			className="flex items-center justify-between"
			aria-label="Global"
		>
			<div className="flex lg:flex-1">
				<Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
					<span className="sr-only">Amazing Photos</span>
					<IconLogo />
					<span className="font-semibold text-xl">Amazing Photos</span>
				</Link>
			</div>
			<div className="flex items-center gap-x-6">
				{session?.user ? (
					<div className="flex items-center gap-4 bg-black/10 backdrop-blur-sm rounded-full pl-3 pr-5 py-2 border border-white/10">
						{session.user.image ? (
							<Image
								src={session.user.image}
								alt={`${session.user.name}'s profile`}
								width={32}
								height={32}
								className="rounded-full ring-2 ring-indigo-400"
							/>
						) : (
							<div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
								<span>{session.user.name?.[0]}</span>
							</div>
						)}
						<div>
							<p className="text-sm font-medium">{session.user.name}</p>
							<div className="flex items-center justify-between gap-3">
								<Link
									href="/generate"
									className="text-xs text-indigo-300 hover:underline"
								>
									Dashboard
								</Link>
								<span className="text-white/20">•</span>
								<SignOutButton />
							</div>
						</div>
					</div>
				) : (
					<button
						onClick={onSignInClick}
						type="button"
						className="font-semibold leading-6 hover:text-indigo-300"
					>
						Sign In <span aria-hidden="true">&rarr;</span>
					</button>
				)}
			</div>
		</nav>
	</header>
);

const ImageColumn = ({
	images,
	animationClass,
}: {
	images: { id: string; src: string }[];
	animationClass: string;
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const fullImageList = [
		...images,
		...images.map((image) => ({ ...image, id: `${image.id}-clone` })),
	];
	return (
		<div
			ref={containerRef}
			className="flex flex-col space-y-6 h-full overflow-hidden"
		>
			<div className={`flex flex-col space-y-6 ${animationClass}`}>
				{fullImageList.map((image) => (
					<AnimatedImage
						key={image.id}
						src={image.src}
						containerRef={containerRef}
					/>
				))}
			</div>
		</div>
	);
};

const AnimatedImage = ({
	src,
	containerRef,
}: {
	src: string;
	containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
	const [scope, animate] = useAnimate();

	const isInView = useInView(scope, {
		root: containerRef,
		margin: "-40% 0px -40% 0px",
	});

	const { scrollYProgress } = useScroll({
		target: scope,
		container: containerRef,
		offset: ["start end", "end start"],
	});
	const opacity = useTransform(
		scrollYProgress,
		[0, 0.3, 0.7, 1],
		[0.5, 1, 1, 0.5],
	);

	useEffect(() => {
		if (isInView) {
			animate(
				scope.current,
				{ scale: [1.1, 1.2, 1.1] },
				{
					duration: 3,
					repeat: Infinity,
					repeatType: "mirror",
					ease: "easeInOut",
				},
			);
		} else {
			animate(scope.current, { scale: 1 }, { duration: 0.5, ease: "easeOut" });
		}
	}, [isInView, animate, scope]);

	return (
		<div className="aspect-square w-full relative rounded-xl shadow-2xl overflow-hidden">
			<motion.div ref={scope} style={{ opacity }} className="w-full h-full">
				<Image src={src} alt="Generated photo" fill className="object-cover" />
			</motion.div>
		</div>
	);
};
