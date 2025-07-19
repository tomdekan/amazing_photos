"use client";

import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

type User = {
	name?: string | null;
	image?: string | null;
};

export const UserMenu = ({
	user,
	currentPage,
}: {
	user: User;
	currentPage: "home" | "dashboard";
}) => {
	const navLink =
		currentPage === "home"
			? { href: "/generate", text: "Dashboard" }
			: { href: "/", text: "Home" };

	return (
		<div className="flex items-center gap-4 bg-black/10 backdrop-blur-sm rounded-full pl-3 pr-5 py-2 border border-white/10">
			{user.image ? (
				<Image
					src={user.image}
					alt={`${user.name || "user"}'s profile`}
					width={32}
					height={32}
					className="rounded-full ring-2 ring-indigo-400"
				/>
			) : (
				<div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
					<span>{user.name?.[0]}</span>
				</div>
			)}
			<div>
				<p className="text-sm font-medium">{user.name}</p>
				<div className="flex items-center gap-3">
					<Link
						href={navLink.href}
						className="text-xs text-indigo-300 hover:underline"
					>
						{navLink.text}
					</Link>
					<span className="text-white/20">•</span>
					<SignOutButton />
				</div>
			</div>
		</div>
	);
}; 