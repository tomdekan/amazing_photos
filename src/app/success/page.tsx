import Stripe from 'stripe';
import { notFound } from 'next/navigation';

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) return notFound();

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Payment complete ✅</h1>
      <p>
        Thanks, {session.customer_details?.name ?? 'friend'}! A receipt has been
        emailed to {session.customer_details?.email}.
      </p>
    </main>
  );
}
