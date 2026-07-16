"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useRouter } from "next/navigation";

const ALLOWED = ["accountant", "super admin"];

export default function AccountsLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const role = user?.role?.toLowerCase() || "";
      if (!user || !ALLOWED.includes(role)) {
        router.replace("/");
      }
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-lg font-semibold">Loading Accounts access...</p>
      </div>
    );
  }

  const role = user?.role?.toLowerCase() || "";
  if (!user || !ALLOWED.includes(role)) {
    return (
      <div className="rounded-xl border border-stroke bg-white p-8 text-center dark:border-stroke-dark dark:bg-dark-2">
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-500">Accounts module is restricted to Accountant users.</p>
      </div>
    );
  }

  return <>{children}</>;
}
