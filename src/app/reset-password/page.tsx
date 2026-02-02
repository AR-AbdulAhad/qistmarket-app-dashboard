
import { Suspense } from 'react';
import ResetForm from '../../components/reset-password/ResetForm';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-lg font-medium">Loading reset form...</p>
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}