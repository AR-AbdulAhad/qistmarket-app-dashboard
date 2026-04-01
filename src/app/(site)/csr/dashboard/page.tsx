"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from "js-cookie";

interface CsrDashboardStats {
  totalOrdersToday: number;
  websiteOrdersPending: number;
  repeatCustomersToday: number;
  clearAccountsCount: number;
  statusCounts: {
    new: number;
    pending: number;
    in_progress: number;
    expired: number;
    picked: number;
    delivered: number;
    cancelled: number;
    approved: number;
  };
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
  remainingTarget: number;
}

export default function CsrDashboardPage() {
  const [stats, setStats] = useState<CsrDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("auth_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/csr-dashboard-stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (error) {
        console.error("Failed to load CSR dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = stats
    ? [
        { label: "Orders Today", value: stats.totalOrdersToday, color: "bg-blue-500" },
        { label: "Website Pending", value: stats.websiteOrdersPending, color: "bg-cyan-500" },
        { label: "Repeat Customers", value: stats.repeatCustomersToday, color: "bg-indigo-500" },
        { label: "Clear Accounts", value: stats.clearAccountsCount, color: "bg-green-500" },
        { label: "New Orders", value: stats.statusCounts.new, color: "bg-sky-500" },
        { label: "Pending Orders", value: stats.statusCounts.pending, color: "bg-yellow-500" },
        { label: "In Progress", value: stats.statusCounts.in_progress, color: "bg-orange-500" },
        { label: "Expired Orders", value: stats.statusCounts.expired, color: "bg-rose-500" },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Breadcrumb pageName="CSR Dashboard" />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-900">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CSR Dashboard</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This dashboard is built for the Sale Officer / CSR role. It covers order booking, website orders, customer search, order tracking, clear accounts and performance analytics in accordance with the document.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ))
              : cards.map((card) => (
                  <div key={card.label} className={`${card.color} rounded-2xl p-5 text-white shadow-lg`}>
                    <p className="text-sm opacity-90">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold">{card.value.toLocaleString()}</p>
                  </div>
                ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Summary</h2>
          {loading ? (
            <div className="mt-6 space-y-3">
              <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            </div>
          ) : stats ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Daily Sales</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">PKR {stats.dailySales.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Weekly Sales</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">PKR {stats.weeklySales.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Sales</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">PKR {stats.monthlySales.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Remaining Target</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">PKR {stats.remainingTarget.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">Unable to load stats at this time.</p>
          )}
        </section>
      </div>
    </div>
  );
}
