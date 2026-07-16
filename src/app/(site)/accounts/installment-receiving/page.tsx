"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { HandCoins, Wallet, Wifi, CheckCircle2, AlertCircle } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OutletSelector from "@/components/common/OutletSelector";
import PageHeader from "@/components/Accounts/PageHeader";
import EmptyState from "@/components/Accounts/EmptyState";
import { StatCardSkeleton, TableSkeleton } from "@/components/Accounts/Skeleton";
import StatCard, { PKR } from "@/components/Accounts/StatCard";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface DueRow { order_id: number; order_ref: string; customer_name: string; outlet_name: string; month: number; dueDate: string; amount: number }
interface Overview {
  dueCount: number;
  due: DueRow[];
  advancePending: number;
  mix: { fullyPaidCount: number; partialCount: number; otherCount: number };
  collections: { cash: number; online: number };
}

export default function InstallmentReceivingPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [outletId, setOutletId] = useState("all");

  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (!token) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/accounts/installment-receiving?outletId=${outletId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => { if (json.success) setData(json.data); })
      .catch((err) => console.error("Failed to load installment receiving overview:", err))
      .finally(() => setLoading(false));
  }, [outletId]);

  return (
    <>
      <Breadcrumb pageName="Installment Receiving" />
      <PageHeader
        icon={HandCoins}
        title="Installment Receiving"
        subtitle="Due installments, advance/partial payment mix, and cash vs. online collections."
        actions={<OutletSelector selectedId={outletId} onSelect={setOutletId} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={AlertCircle} label="Due Installments" value={data?.dueCount ?? 0} accent="text-rose-600" bg="bg-rose-50 dark:bg-rose-500/10" bar="bg-rose-500" />
            <StatCard icon={Wallet} label="Advance Pending" value={PKR(data?.advancePending || 0)} accent="text-amber-600" bg="bg-amber-50 dark:bg-amber-500/10" bar="bg-amber-500" />
            <StatCard icon={CheckCircle2} label="Fully Paid Orders" value={data?.mix.fullyPaidCount ?? 0} accent="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-500/10" bar="bg-emerald-500" />
            <StatCard icon={HandCoins} label="Cash Collected" value={PKR(data?.collections.cash || 0)} accent="text-orange-600" bg="bg-orange-50 dark:bg-orange-500/10" bar="bg-orange-500" />
            <StatCard icon={Wifi} label="Online Collected" value={PKR(data?.collections.online || 0)} accent="text-blue-600" bg="bg-blue-50 dark:bg-blue-500/10" bar="bg-blue-500" />
          </>
        )}
      </div>

      {loading ? (
        <TableSkeleton />
      ) : data && data.due.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Order Ref</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Outlet</th>
                  <th className="px-4 py-3 font-bold">Month</th>
                  <th className="px-4 py-3 font-bold">Due Date</th>
                  <th className="px-4 py-3 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.due.map((row, i) => (
                  <tr key={`${row.order_id}-${row.month}-${i}`} className="border-t border-slate-50 transition hover:bg-slate-50/70 dark:border-white/5 dark:hover:bg-white/5">
                    <td className="px-4 py-3.5 font-semibold text-dark dark:text-white">{row.order_ref}</td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{row.customer_name}</td>
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{row.outlet_name}</td>
                    <td className="px-4 py-3.5 text-gray-500">{row.month}</td>
                    <td className="px-4 py-3.5 text-gray-500">{new Date(row.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-bold text-dark dark:text-white">{PKR(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
          <EmptyState icon={HandCoins} title="No due installments" description="Everything is either not yet due or already collected." />
        </div>
      )}
    </>
  );
}
