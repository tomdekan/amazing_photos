"use client";

const Spinner = () => (
	<svg
		className="animate-spin h-5 w-5 text-white"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		role="img"
		aria-labelledby="spinner-title"
	>
		<title id="spinner-title">Loading...</title>
		<circle
			className="opacity-25"
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			strokeWidth="4"
		></circle>
		<path
			className="opacity-75"
			fill="currentColor"
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
		></path>
	</svg>
);

interface ImagePlaceholderProps {
	prompt: string;
	timer: number;
}

export function ImagePlaceholder({ prompt, timer }: ImagePlaceholderProps) {
	return (
		<div className="relative aspect-square bg-slate-800/50 rounded-lg overflow-hidden group border-2 border-dashed border-slate-700">
			<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center text-white">
				<div className="mb-4">
					<Spinner />
				</div>
				<div className="font-semibold">Generating...</div>
				<div className="text-3xl font-bold my-1">{timer.toFixed(1)}s</div>
				<p className="text-xs text-slate-300 line-clamp-2">{prompt}</p>
			</div>
		</div>
	);
} 