"use client";

import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { useState } from "react";
import type { User } from "@/generated/prisma";

interface SubscriptionData {
    planName: string;
    status: string;
}

interface UserMenuProps {
	user: User;
	currentPage: "home" | "dashboard";
	subscription?: SubscriptionData | null;
}

const SubscriptionBadge = ({ status, planName }: { status: string; planName: string }) => {
    const isActive = status === 'active';
    const colorClasses = isActive 
        ? 'bg-green-500/20 text-green-300' 
        : 'bg-yellow-500/20 text-yellow-300';
    const dotClasses = isActive ? 'bg-green-400' : 'bg-yellow-400';

    return (
        <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${colorClasses}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dotClasses}`}></div>
            <span>{planName}</span>
        </div>
    );
};

export const UserMenu = ({
	user,
	currentPage,
	subscription = null,
}: UserMenuProps) => {
	const [loadingBilling, setLoadingBilling] = useState(false);

	const navLink =
		currentPage === "home"
			? { href: "/generate", text: "Dashboard" }
			: { href: "/", text: "Home" };

	const handleBilling = async () => {
		if (!subscription) return;
		
		setLoadingBilling(true);
		try {
			const res = await fetch('/api/subscription/manage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: user.id }),
			});
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			} else {
				console.error('Failed to fetch management URL', data.error);
			}
		} catch (err) {
			console.error('Error redirecting to subscription management', err);
		} finally {
			setLoadingBilling(false);
		}
	};

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
                <div className="flex items-center gap-2">
				    <p className="text-sm font-medium">{user.name}</p>
                    {subscription ? (
                        <SubscriptionBadge status={subscription.status} planName={subscription.planName} />
                    ) : (
                        <div className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">Free</div>
                    )}
                </div>
				<div className="flex items-center gap-3 mt-0.5">
					<Link
						href={navLink.href}
						className="text-xs text-indigo-300 hover:underline"
					>
						{navLink.text}
					</Link>
					{subscription && (
						<>
							<span className="text-white/20">•</span>
							<button
								type="button"
								onClick={handleBilling}
								disabled={loadingBilling}
								className="text-xs text-indigo-300 hover:underline disabled:opacity-50"
							>
								{loadingBilling ? 'Loading...' : 'Billing'}
							</button>
						</>
					)}
					<span className="text-white/20">•</span>
					<SignOutButton />
				</div>
			</div>
		</div>
	);
};
