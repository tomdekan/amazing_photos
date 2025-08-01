import { PrismaClient } from "@/generated/prisma";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

interface ExtendedSubscription extends Stripe.Subscription {
	customer: string;
	current_period_start: number;
	current_period_end: number;
}

interface ExtendedInvoice extends Stripe.Invoice {
	subscription: string;
}

if (!process.env.STRIPE_SECRET_KEY) {
	throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
	const body = await req.text();
	const sig = req.headers.get("stripe-signature") as string;

	if (!process.env.STRIPE_WEBHOOK_SECRET) {
		throw new Error("STRIPE_WEBHOOK_SECRET is not set");
	}

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(
			body,
			sig,
			process.env.STRIPE_WEBHOOK_SECRET,
		);
	} catch (err: unknown) {
		console.error(
			"⚠️  Signature check failed.",
			err instanceof Error ? err.message : "Unknown error",
		);
		return new NextResponse("Signature error", { status: 400 });
	}

	console.info(`🎣 Webhook received: ${event.type} - ${event.id}`);

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutSessionCompleted(session);
				break;
			}

			case "customer.subscription.created":
			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionChange(subscription);
				break;
			}

			case "customer.subscription.deleted": {
				const deletedSubscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionDeleted(deletedSubscription);
				break;
			}

			case "invoice.payment_succeeded": {
				const invoice = event.data.object as Stripe.Invoice;
				await handleInvoicePaymentSucceeded(invoice);
				break;
			}

			case "invoice.payment_failed": {
				const failedInvoice = event.data.object as Stripe.Invoice;
				await handleInvoicePaymentFailed(failedInvoice);
				break;
			}

			default:
				console.info(`Unhandled event type: ${event.type}`);
		}
	} catch (error) {
		console.error(`Error handling webhook event ${event.type}:`, error);
		return new NextResponse("Webhook handler failed", { status: 500 });
	}

	return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(
	session: Stripe.Checkout.Session,
) {
	const userId = session.client_reference_id;

	if (!userId) {
		console.error("No client_reference_id (userId) found in checkout session");
		return;
	}

	// For subscription mode, get the subscription details
	if (session.mode === "subscription" && session.subscription) {
		try {
			// Get the subscription from Stripe to ensure we have the latest data
			const subscription: Stripe.Subscription =
				await stripe.subscriptions.retrieve(session.subscription as string);

			const planId = subscription.metadata?.planId;

			if (!planId) {
				console.error("No planId found in subscription metadata");
				return;
			}

			// Update our database
			await prisma.subscription.upsert({
				where: { userId: userId },
				update: {
					stripeSubscriptionId: subscription.id,
					stripeCustomerId: subscription.customer as string,
					status: subscription.status,
					planId: planId,
					currentPeriodStart: new Date(
						(subscription as ExtendedSubscription).current_period_start * 1000,
					),
					currentPeriodEnd: new Date(
						(subscription as ExtendedSubscription).current_period_end * 1000,
					),
					cancelAtPeriodEnd: subscription.cancel_at_period_end,
					generationsUsed: 0,
					lastResetDate: new Date(),
				},
				create: {
					userId: userId,
					stripeSubscriptionId: subscription.id,
					stripeCustomerId: subscription.customer as string,
					status: subscription.status,
					planId: planId,
					currentPeriodStart: new Date(
						(subscription as ExtendedSubscription).current_period_start * 1000,
					),
					currentPeriodEnd: new Date(
						(subscription as ExtendedSubscription).current_period_end * 1000,
					),
					cancelAtPeriodEnd: subscription.cancel_at_period_end,
					generationsUsed: 0,
					lastResetDate: new Date(),
				},
			});

			console.info(
				`✅ Subscription checkout completed and saved for user ${userId}, customer ${subscription.customer}`,
			);
		} catch (error) {
			console.error(
				"Error handling subscription in checkout completion:",
				error,
			);
		}
	} else {
		console.info(`✅ Non-subscription checkout completed for ${userId}`);
	}
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
	console.info(`🔍 Processing subscription change for ${subscription.id}:`);
	console.info(`Customer: ${subscription.customer}`);


	const userId = subscription.metadata.userId;
	const planId = subscription.metadata.planId;

	if (!userId || !planId) {
		console.error("❌ Missing userId or planId in subscription metadata:", {
			userId,
			planId,
			allMetadata: subscription.metadata,
		});
		return;
	}

	await prisma.subscription.upsert({
		where: { userId: userId },
		update: {
			stripeSubscriptionId: subscription.id,
			stripeCustomerId: subscription.customer as string,
			status: subscription.status,
			planId: planId,
			currentPeriodStart: new Date(
				(subscription as ExtendedSubscription).current_period_start * 1000,
			),
			currentPeriodEnd: new Date(
				(subscription as ExtendedSubscription).current_period_end * 1000,
			),
			cancelAtPeriodEnd: subscription.cancel_at_period_end,
		},
		create: {
			userId: userId,
			stripeSubscriptionId: subscription.id,
			stripeCustomerId: subscription.customer as string,
			status: subscription.status,
			planId: planId,
			currentPeriodStart: new Date(
				(subscription as ExtendedSubscription).current_period_start * 1000,
			),
			currentPeriodEnd: new Date(
				(subscription as ExtendedSubscription).current_period_end * 1000,
			),
			cancelAtPeriodEnd: subscription.cancel_at_period_end,
			generationsUsed: 0,
			lastResetDate: new Date(),
		},
	});

	console.info(`✅ Subscription ${subscription.status} for user ${userId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	const userId = subscription.metadata.userId;

	if (!userId) {
		console.error("Missing userId in subscription metadata");
		return;
	}

	await prisma.subscription.update({
		where: { userId: userId },
		data: {
			status: "canceled",
			cancelAtPeriodEnd: true,
		},
	});

	console.info(`✅ Subscription deleted for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
	const subscriptionId = (invoice as ExtendedInvoice).subscription;

	if (subscriptionId) {
		const subscription = await prisma.subscription.findUnique({
			where: { stripeSubscriptionId: subscriptionId },
		});

		if (subscription) {
			// Reset usage for new billing period
			await prisma.subscription.update({
				where: { id: subscription.id },
				data: {
					generationsUsed: 0,
					lastResetDate: new Date(),
				},
			});

			console.info(`✅ Usage reset for subscription ${subscriptionId}`);
		}
	}
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
	const subscriptionId = (invoice as ExtendedInvoice).subscription;

	if (subscriptionId) {
		const subscription = await prisma.subscription.findUnique({
			where: { stripeSubscriptionId: subscriptionId },
		});

		if (subscription) {
			await prisma.subscription.update({
				where: { id: subscription.id },
				data: {
					status: "past_due",
				},
			});

			console.info(`⚠️ Payment failed for subscription ${subscriptionId}`);
		}
	}
}
