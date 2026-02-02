"use client";

import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import type { PropsWithChildren } from "react";
import { AuthProvider } from "../../../contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar />

      <div className="w-full bg-gray-2 dark:bg-[#000000]">
        <Header />

        <main className="mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
    </SidebarProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}