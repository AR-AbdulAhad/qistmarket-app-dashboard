"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useRouter } from "next/navigation";

const ALLOWED_ROLES = [
  "csr",
  "sale officer",
  "sales officer",
  "sale_officer",
  "sales_officer",
];

export default function CsrLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const role = user?.role?.toLowerCase() || "";
      if (!user || !ALLOWED_ROLES.includes(role)) {
        router.replace("/");
      }
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-gray-700 dark:bg-slate-900 dark:text-gray-200">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-md dark:border-gray-800 dark:bg-gray-900">
          <p className="text-lg font-semibold">Loading CSR access...</p>
        </div>
      </div>
    );
  }

  const role = user?.role?.toLowerCase() || "";
  if (!user || !ALLOWED_ROLES.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-gray-700 dark:bg-slate-900 dark:text-gray-200">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-md dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            The CSR portal is restricted to Sale Officer / CSR users only.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
