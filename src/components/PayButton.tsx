'use client';

type Props = { priceId: string };

export default function PayButton({ priceId }: Props) {
  async function handleClick() {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const { url, error } = await res.json();
    if (error) return alert(error);

    window.location.href = url;   // let Stripe host the secure page
  }

  return <button onClick={handleClick}>Buy now</button>;
}
