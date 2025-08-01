"use client";

import FreeGenerationForm from "@/components/FreeGenerationForm";
import { IconLogo } from "@/components/icon-components";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import LoginModal from "@/components/LoginModal";
import { UserMenu } from "@/components/UserMenu";
import { authClient, type Session } from "@/lib/auth-client";
import { motion, useAnimate, useInView, useScroll } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
	const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

	useEffect(() => {
		authClient.getSession().then(({ data }) => setSession(data));
	}, []);

	const openPreviewModal = (imageUrl: string) => {
		setSelectedImageUrl(imageUrl);
		setIsPreviewModalOpen(true);
	};

	const closePreviewModal = () => {
		setIsPreviewModalOpen(false);
		setSelectedImageUrl(null);
	};

	const images1 = [
		{
			id: "p1-1",
			src: "https://ybjxeqbqhk3uwkzj.public.blob.vercel-storage.com/starter-1753464520734-Yzu3GFbdPNVn0VR7ww2rFdeMTpntySBE-1.webp",
		},
		{
			id: "p1-2",
			src: "https://ybjxeqbqhk3uwkzj.public.blob.vercel-storage.com/starter-1753464537459-Yzu3GFbdPNVn0VR7ww2rFdeMTpntySBE-4.webp",
		},
		{
			id: "p1-3",
			src: "https://ybjxeqbqhk3uwkzj.public.blob.vercel-storage.com/starter-1753464520734-Yzu3GFbdPNVn0VR7ww2rFdeMTpntySBE-1.webp",
		},
		{
			id: "p1-4",
			src: "https://ybjxeqbqhk3uwkzj.public.blob.vercel-storage.com/starter-1753464058160-Yzu3GFbdPNVn0VR7ww2rFdeMTpntySBE-54.webp",
		},
		{
			id: "p1-5",
			src: "https://ybjxeqbqhk3uwkzj.public.blob.vercel-storage.com/starter-1753464037252-Yzu3GFbdPNVn0VR7ww2rFdeMTpntySBE-48.webp",
		},
	];

	const images2 = [
		{
			id: "p2-1",
			src: "https://ybjxeqbqhk3uwkzj.public.blob.vercel-storage.com/starter-1753464026701-Yzu3GFbdPNVn0VR7ww2rFdeMTpntySBE-45.webp",
		},
		{
			id: "p2-2",
			src: "https://ybjxeqbqhk3uwkzj.public.blob.vercel-storage.com/starter-1753464015810-Yzu3GFbdPNVn0VR7ww2rFdeMTpntySBE-41.webp",
		},
		{
			id: "p2-3",
			src: "https://ybjxeqbqhk3uwkzj.public.blob.vercel-storage.com/starter-1753464005103-Yzu3GFbdPNVn0VR7ww2rFdeMTpntySBE-37.webp",
		},
		{
			id: "p2-4",
			src: "https://ybjxeqbqhk3uwkzj.public.blob.vercel-storage.com/starter-1753464599255-Yzu3GFbdPNVn0VR7ww2rFdeMTpntySBE-21.webp",
		},
	];

	return (
		<div className="min-h-screen bg-slate-950 text-white flex flex-col">
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>
			<ImagePreviewModal
				isOpen={isPreviewModalOpen}
				onClose={closePreviewModal}
				imageUrl={selectedImageUrl}
			/>
			<main className="relative grid lg:grid-cols-2 flex-grow">
				{/* Left side: Content and Form */}
				<div className="flex flex-col items-center pt-2 px-8 relative z-10 lg:col-span-1">
					<Header
						session={session}
						onSignInClick={() => setIsLoginModalOpen(true)}
					/>
					<div className="w-full pt-6">
						<div className="text-center mb-10">
							<h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
								A Perfect Photo of You,
							</h1>
							<h2 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mt-2">
								Generated in Seconds.
							</h2>
							<p className="mt-6 text-lg text-slate-300 max-w-xl mx-auto">
								Sign in and get started. Create your own model, and generate
								amazing photos.
							</p>
						</div>

						<FreeGenerationForm session={session} />
					</div>
				</div>

				{/* Right side: Image showcase */}
				<div className="absolute inset-0 z-0 lg:relative lg:col-span-1">
					<div className="h-full w-full relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-950 opacity-20 lg:opacity-100">
						<div className="absolute inset-0 grid grid-cols-2 gap-1 px-2">
							<ImageColumn
								images={images1}
								animationClass="animate-scroll-up"
								onImageClick={openPreviewModal}
							/>
							<ImageColumn
								images={images2}
								animationClass="animate-scroll-down"
								onImageClick={openPreviewModal}
							/>
						</div>
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
}

const Header = ({
	session,
	onSignInClick,
}: {
	session: Session | null;
	onSignInClick: () => void;
}) => (
	<header className="z-50 w-full mb-8">
		<nav className="flex items-center justify-between" aria-label="Global">
			<div className="flex lg:flex-1">
				<Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
					<span className="sr-only">Amazing Photos</span>
					<IconLogo />
					<span className="font-semibold text-lg">Amazing Photos</span>
				</Link>
			</div>
			<div className="flex items-center gap-x-6 h-12">
				{session?.user ? (
					<UserMenu
						user={{ ...session.user, image: session.user.image ?? null }}
						currentPage="home"
					/>
				) : (
					<motion.button
						onClick={onSignInClick}
						type="button"
						className="group flex items-center gap-1 font-semibold leading-6 hover:text-indigo-300"
						whileTap={{ scale: 0.98 }}
						transition={{ type: "spring", stiffness: 400, damping: 17 }}
					>
						<span>Sign In</span>
						<span
							aria-hidden="true"
							className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
						>
							&rarr;
						</span>
					</motion.button>
				)}
			</div>
		</nav>
	</header>
);

const ImageColumn = ({
	images,
	animationClass,
	onImageClick,
}: {
	images: { id: string; src: string }[];
	animationClass: string;
	onImageClick: (url: string) => void;
}) => {
	const containerRef = useRef<HTMLUListElement>(null);
	const [isHovering, setIsHovering] = useState(false);

	const fullImageList = [
		...images,
		...images.map((image) => ({ ...image, id: `${image.id}-clone` })),
	];
	return (
		<ul
			ref={containerRef}
			className="group flex flex-col space-y-6 h-full overflow-hidden"
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			<div
				className={`flex flex-col space-y-1 ${animationClass}`}
				style={{ animationPlayState: isHovering ? "paused" : "running" }}
			>
				{fullImageList.map((image, index) => (
					<li key={`${image.id}-${index}`}>
						<AnimatedImage
							src={image.src}
							containerRef={containerRef}
							onClick={() => onImageClick(image.src)}
						/>
					</li>
				))}
			</div>
		</ul>
	);
};

const AnimatedImage = ({
	src,
	containerRef,
	onClick,
}: {
	src: string;
	containerRef: React.RefObject<HTMLUListElement | null>;
	onClick: () => void;
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

	return (
		<button
			type="button"
			className="aspect-square w-full relative rounded-xl shadow-2xl overflow-hidden cursor-pointer group block"
			onClick={onClick}
		>
			<motion.div ref={scope} className="w-full h-full">
				<Image
					src={src}
					alt="Generated photo"
					fill
					className="object-cover hover:scale-105 transition-all duration-500"
				/>
			</motion.div>
		</button>
	);
};
