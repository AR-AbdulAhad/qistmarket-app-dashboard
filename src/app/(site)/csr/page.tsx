"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from "js-cookie";

export default function CsrPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/csr/dashboard");
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-7xl py-20 text-center">
      <Breadcrumb pageName="CSR Dashboard" />
      <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm dark:border-gray-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Redirecting to CSR Dashboard...</h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">If you are not redirected automatically, please navigate to /csr/dashboard.</p>
      </div>
    </div>
  );
}
