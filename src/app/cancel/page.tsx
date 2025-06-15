export default async function Cancel({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Payment cancelled</h1>
      <p>
        No charge was made{reason ? ` (Stripe said: “${reason}”).` : '.'} Feel free
        to try again any time.
      </p>
    </main>
  );
}
