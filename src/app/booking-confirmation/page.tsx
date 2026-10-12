import { Suspense } from 'react';
import { ConfirmationView } from '@/features/booking/confirmation-view';

export default function BookingConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationView />
    </Suspense>
  );
}
