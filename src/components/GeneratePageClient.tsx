"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export function GeneratePageClient({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const paymentCancelled = searchParams.get('payment_cancelled');
    const paymentSuccess = searchParams.get('payment_success');

    if (paymentCancelled) {
      toast.error('Payment was cancelled', {
        description: 'Your payment process was not completed. Please try again.',
        duration: 8000,
      });
    }

    if (paymentSuccess) {
      toast.success('Payment successful!', {
        description: 'Welcome! You can now start generating images.',
        duration: 8000,
      });
    }

    if (paymentCancelled || paymentSuccess) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('payment_cancelled');
      newSearchParams.delete('payment_success');
      newSearchParams.delete('session_id');
      
      const newUrl = `${pathname}?${newSearchParams.toString()}`;
      const finalUrl = newSearchParams.toString() ? newUrl.replace(/\?$/, '') : pathname;
      
      router.replace(finalUrl, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return <>{children}</>;
}
