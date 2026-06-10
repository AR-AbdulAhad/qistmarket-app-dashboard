"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmployeeAuth } from "../../../contexts/EmployeeAuthContext";

export default function EmployeeProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useEmployeeAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/employee/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-2 dark:bg-[#000000]">
        <p className="text-lg font-semibold text-dark dark:text-white">Loading...</p>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
