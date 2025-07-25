"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type ImageType = {
	id: string;
	imageUrl: string;
	prompt: string;
};

type ThumbnailStripProps = {
	images: ImageType[];
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
};

export function ThumbnailStrip({
	images,
	selectedIndex,
	setSelectedIndex,
}: ThumbnailStripProps) {
	const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

	useEffect(() => {
		if (thumbnailRefs.current[selectedIndex]) {
			thumbnailRefs.current[selectedIndex]?.scrollIntoView({
				behavior: "smooth",
				inline: "center",
				block: "nearest",
			});
		}
	}, [selectedIndex]);

	return (
		<div className="absolute bottom-0 left-0 right-0 z-10">
			<div className="flex justify-center gap-2 px-10 overflow-x-auto py-5 no-scrollbar">
				{images.map((image, index) => (
					<button
						key={image.id}
						ref={(el) => {
							thumbnailRefs.current[index] = el;
						}}
						type="button"
						onClick={() => setSelectedIndex(index)}
						className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
							index === selectedIndex
								? "ring-2 ring-white scale-110"
								: "opacity-70 hover:opacity-100"
						}`}
					>
						<Image
							src={image.imageUrl}
							alt={image.prompt}
							fill
							style={{ objectFit: "cover" }}
						/>
					</button>
				))}
			</div>
		</div>
	);
} 