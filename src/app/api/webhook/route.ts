import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
  const body = await req.text(); 
  const sig  = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );                                 
  } catch (err: unknown) {
    console.error('⚠️  Signature check failed.', err instanceof Error ? err.message : 'Unknown error');
    return new NextResponse('Signature error', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    await unlockAccess(s.client_reference_id!);
  }

  return NextResponse.json({ received: true });
}

async function unlockAccess(userId: string) {
  // e.g. await prisma.user.update({ where:{id:userId}, data:{hasAccess:true} });
  console.log(`🔓  Access unlocked for ${userId}`);
}
