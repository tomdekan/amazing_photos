'use client';

type Props = { priceId: string };

export default function PayButton({ priceId }: Props) {
  if (!priceId) throw new Error('Price ID is required');

  async function handleClick() {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const { url, error } = await res.json();
    if (error) return alert(error);

    window.location.href = url;
  }

  return <button onClick={handleClick}>Buy now</button>;
}
