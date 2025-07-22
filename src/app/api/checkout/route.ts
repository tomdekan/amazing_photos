import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
	const { priceId, userId, planId } = await req.json(); // { priceId, userId, planId }

	// Get the base URL from headers or environment
	let baseUrl: string;
	if (process.env.NODE_ENV === "production") {
		if (!process.env.NEXT_PUBLIC_SITE_URL) {
			throw new Error("NEXT_PUBLIC_SITE_URL is not set");
		}
		baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
	} else {
		baseUrl = `${req.headers.get("host")}/generate`;
	}

	const session = await stripe.checkout.sessions.create({
		mode: "subscription",
		line_items: [{ price: priceId, quantity: 1 }],
		client_reference_id: userId,
		subscription_data: {
			metadata: {
				userId: userId,
				planId: planId,
			},
		},
		success_url: `${baseUrl}/generate?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${baseUrl}/generate?payment_cancelled=true`,
		currency: "usd",
	});

	return NextResponse.json({ url: session.url });
}
