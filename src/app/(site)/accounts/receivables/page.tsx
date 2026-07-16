"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Users, CalendarDays, ShieldAlert, X, AlertTriangle, TrendingDown, Search } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OutletSelector from "@/components/common/OutletSelector";
import PageHeader from "@/components/Accounts/PageHeader";
import EmptyState from "@/components/Accounts/EmptyState";
import { TableSkeleton } from "@/components/Accounts/Skeleton";
import { PKR } from "@/components/Accounts/StatCard";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const authHeaders = () => ({ Authorization: `Bearer ${Cookies.get("auth_token")}` });

interface ReceivableRow { order_id: number; order_ref: string; customer: string; phone: string; total_amount: number; total_paid: number; balance: number }
interface ScheduleRow { monthNumber: number; label: string; dueDate: string; dueAmount: number; paidAmount: number; remainingAmount: number; status: string }
interface RiskEntry { order_id: number; order_ref: string; customer_name: string; outlet_name: string; remaining: number; missedCount: number }
interface RiskData { summary: { cleared: number; regular: number; overdue: number; defaulter: number }; tiers: { regular: RiskEntry[]; overdue: RiskEntry[]; defaulter: RiskEntry[] } }

const TABS = [
  { key: "outstanding" as const, label: "Outstanding", icon: Users },
  { key: "risk" as const, label: "Risk Analysis", icon: ShieldAlert },
];

export default function AccountsReceivablesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("outstanding");
  const [rows, setRows] = useState<ReceivableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [outletId, setOutletId] = useState("all");
  const [search, setSearch] = useState("");

  const [scheduleOrder, setScheduleOrder] = useState<ReceivableRow | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [risk, setRisk] = useState<RiskData | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskTier, setRiskTier] = useState<"defaulter" | "overdue" | "regular">("defaulter");

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/outlet-reports/recovery?outletId=${outletId}`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((json) => { if (json.success) setRows(json.data); })
      .catch((err) => console.error("Failed to load receivables:", err))
      .finally(() => setLoading(false));
  }, [outletId]);

  useEffect(() => {
    if (tab === "risk" && !risk) {
      setRiskLoading(true);
      fetch(`${BACKEND_URL}/api/accounts/receivables/risk-analysis`, { headers: authHeaders() })
        .then((res) => res.json())
        .then((json) => { if (json.success) setRisk(json.data); })
        .finally(() => setRiskLoading(false));
    }
  }, [tab]);

  const openSchedule = async (row: ReceivableRow) => {
    setScheduleOrder(row);
    setScheduleLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/accounts/receivables/schedule/${row.order_id}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setSchedule(json.data.schedule);
    } finally {
      setScheduleLoading(false);
    }
  };

  const totalReceivable = rows.reduce((acc, r) => acc + r.balance, 0);
  const tierList = risk?.tiers[riskTier] || [];

  return (
    <>
      <Breadcrumb pageName="Customer Receivables" />
      <PageHeader icon={Users} title="Customer Receivables" subtitle="Outstanding customer balances, payment schedules, and risk tiers." actions={<OutletSelector selectedId={outletId} onSelect={setOutletId} />} />

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5 dark:border-purple-500/20 dark:from-purple-500/10 dark:to-transparent">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-600"><Users className="size-6" strokeWidth={2.25} /></div>
        <div><p className="text-xs font-black uppercase tracking-widest text-purple-600/80">Total Outstanding Receivables</p><p className="text-3xl font-black leading-tight text-purple-700 dark:text-purple-400">{PKR(totalReceivable)}</p></div>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-dark-3 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === t.key ? "bg-white text-[#ff3d3d] shadow-sm dark:bg-boxdark" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
            <t.icon className="size-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "outstanding" && (
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order ref, customer, phone..." className="w-full rounded-xl border border-stroke bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
        </div>
      )}

      {tab === "outstanding" && (
        loading ? <TableSkeleton /> : rows.filter((r) => `${r.order_ref} ${r.customer} ${r.phone}`.toLowerCase().includes(search.toLowerCase())).length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                  <tr><th className="px-4 py-3 font-bold">Order Ref</th><th className="px-4 py-3 font-bold">Customer</th><th className="px-4 py-3 font-bold">Phone</th><th className="px-4 py-3 text-right font-bold">Total</th><th className="px-4 py-3 text-right font-bold">Paid</th><th className="px-4 py-3 text-right font-bold">Balance</th><th className="px-4 py-3 font-bold">Schedule</th></tr>
                </thead>
                <tbody>
                  {rows.filter((r) => `${r.order_ref} ${r.customer} ${r.phone}`.toLowerCase().includes(search.toLowerCase())).map((r) => (
                    <tr key={r.order_id} className="border-t border-slate-50 transition hover:bg-slate-50/70 dark:border-white/5 dark:hover:bg-white/5">
                      <td className="px-4 py-3.5 font-semibold text-dark dark:text-white">{r.order_ref}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{r.customer}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{r.phone}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{PKR(r.total_amount)}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{PKR(r.total_paid)}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-purple-600">{PKR(r.balance)}</td>
                      <td className="px-4 py-3.5"><button onClick={() => openSchedule(r)} className="flex items-center gap-1 text-xs font-semibold text-[#ff3d3d] hover:underline"><CalendarDays className="size-3.5" /> View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={Users} title="No outstanding receivables" description="Every customer balance for this selection is fully cleared." /></div>
      )}

      {tab === "risk" && (
        riskLoading ? <TableSkeleton /> : risk ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">Cleared</p><p className="text-xl font-black text-emerald-700 dark:text-emerald-400">{risk.summary.cleared}</p></div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10"><p className="text-[10px] font-black uppercase tracking-widest text-blue-600/80">Regular</p><p className="text-xl font-black text-blue-700 dark:text-blue-400">{risk.summary.regular}</p></div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"><p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80">Overdue</p><p className="text-xl font-black text-amber-700 dark:text-amber-400">{risk.summary.overdue}</p></div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10"><p className="text-[10px] font-black uppercase tracking-widest text-rose-600/80">Defaulter</p><p className="text-xl font-black text-rose-700 dark:text-rose-400">{risk.summary.defaulter}</p></div>
            </div>

            <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-dark-3 w-fit">
              {(["defaulter", "overdue", "regular"] as const).map((t) => (
                <button key={t} onClick={() => setRiskTier(t)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${riskTier === t ? "bg-white text-[#ff3d3d] shadow-sm dark:bg-boxdark" : "text-gray-500"}`}>{t}</button>
              ))}
            </div>

            {tierList.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400"><tr><th className="px-4 py-3 font-bold">Order Ref</th><th className="px-4 py-3 font-bold">Customer</th><th className="px-4 py-3 font-bold">Outlet</th><th className="px-4 py-3 text-right font-bold">Missed</th><th className="px-4 py-3 text-right font-bold">Remaining</th></tr></thead>
                  <tbody>{tierList.map((e) => (
                    <tr key={e.order_id} className="border-t border-slate-50 dark:border-white/5">
                      <td className="px-4 py-3.5 font-semibold text-dark dark:text-white">{e.order_ref}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{e.customer_name}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{e.outlet_name}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-amber-600">{e.missedCount}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-rose-600">{PKR(e.remaining)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={TrendingDown} title={`No customers in the ${riskTier} tier`} /></div>}
          </div>
        ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={AlertTriangle} title="No risk data available" /></div>
      )}

      {/* Payment Schedule Modal */}
      {scheduleOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-boxdark">
            <div className="flex items-center justify-between border-b border-stroke p-6 dark:border-strokedark">
              <div>
                <h2 className="text-xl font-black text-gray-800 dark:text-white">Payment Schedule</h2>
                <p className="text-xs text-gray-500">{scheduleOrder.order_ref} — {scheduleOrder.customer}</p>
              </div>
              <button onClick={() => setScheduleOrder(null)} className="text-gray-400 transition-all hover:rotate-90 hover:text-red-500"><X size={22} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {scheduleLoading ? <TableSkeleton rows={4} cols={4} /> : schedule.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400"><tr><th className="px-6 py-3 font-bold">Month</th><th className="px-6 py-3 font-bold">Due Date</th><th className="px-6 py-3 text-right font-bold">Due</th><th className="px-6 py-3 text-right font-bold">Paid</th><th className="px-6 py-3 font-bold">Status</th></tr></thead>
                  <tbody>{schedule.map((s) => (
                    <tr key={s.monthNumber} className="border-t border-slate-50 dark:border-white/5">
                      <td className="px-6 py-3.5 text-gray-600 dark:text-gray-300">{s.label}</td>
                      <td className="px-6 py-3.5 text-gray-500">{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "—"}</td>
                      <td className="px-6 py-3.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{PKR(s.dueAmount)}</td>
                      <td className="px-6 py-3.5 text-right tabular-nums text-emerald-600">{PKR(s.paidAmount)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.status === "paid" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-500 dark:bg-white/10"}`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <EmptyState icon={CalendarDays} title="No schedule found" />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
