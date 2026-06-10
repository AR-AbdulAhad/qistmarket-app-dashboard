"use client";

import EmployeeProtectedRoute from "@/components/EmployeePortal/EmployeeProtectedRoute";
import { EmployeeSidebar } from "@/components/EmployeePortal/EmployeeSidebar";

export default function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmployeeProtectedRoute>
      <div className="flex min-h-screen bg-gray-2 dark:bg-[#000000]">
        <EmployeeSidebar />
        <main className="flex-1 overflow-auto p-4 pt-16 lg:p-8 lg:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </EmployeeProtectedRoute>
  );
}
