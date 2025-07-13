import Stripe from 'stripe';
import { notFound } from 'next/navigation';
import { SuccessRedirect } from '@/components/SuccessRedirect';

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

  const customerName = session.customer_details?.name ?? 'friend';
  const customerEmail = session.customer_details?.email ?? '';

  return (
    <SuccessRedirect 
      customerName={customerName}
      customerEmail={customerEmail}
    />
  );
}
