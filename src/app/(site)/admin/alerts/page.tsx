"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, TriangleAlert, Info, CheckCircle2 } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PageHeader from "@/components/Accounts/PageHeader";
import EmptyState from "@/components/Accounts/EmptyState";
import { TableSkeleton } from "@/components/Accounts/Skeleton";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const authHeaders = () => ({ Authorization: `Bearer ${Cookies.get("auth_token")}` });

interface Alert {
  severity: "serious" | "warning" | "good" | string;
  type?: string;
  title: string;
  message: string;
  link?: string;
}

const SEVERITY_STYLE: Record<string, { icon: any; classes: string }> = {
  serious: { icon: ShieldAlert, classes: "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300" },
  warning: { icon: TriangleAlert, classes: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300" },
  good: { icon: CheckCircle2, classes: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300" },
};

const SEVERITY_RANK: Record<string, number> = { serious: 0, warning: 1, good: 2 };

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/accounts/alerts`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/accounts/audit/fraud-alerts`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/accounts/audit/duplicate-cnic`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/accounts/audit/low-recovery`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/accounts/cash/limits`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([globalJson, fraudJson, cnicJson, lowRecoveryJson, cashLimitsJson]) => {
        const cashLimitAlerts: Alert[] = cashLimitsJson.success
          ? (cashLimitsJson.data || [])
              .filter((l: any) => l.is_over_limit)
              .map((l: any) => ({
                severity: "serious",
                type: "cash_limit_exceeded",
                title: `${l.name}: cash limit exceeded`,
                message: `${l.name} has PKR ${l.current_pending.toLocaleString()} pending cash-in-hand, over its PKR ${l.daily_limit.toLocaleString()} daily limit.`,
              }))
          : [];

        const combined: Alert[] = [
          ...(globalJson.success ? globalJson.data.alerts : []),
          ...(fraudJson.success ? fraudJson.data.alerts : []),
          ...(cnicJson.success ? cnicJson.data.alerts : []),
          ...(lowRecoveryJson.success ? lowRecoveryJson.data.alerts : []),
          ...cashLimitAlerts,
        ];
        combined.sort((a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9));
        setAlerts(combined);
      })
      .catch((err) => console.error("Failed to load alerts:", err))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    serious: alerts.filter((a) => a.severity === "serious").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    good: alerts.filter((a) => a.severity === "good").length,
  };

  return (
    <>
      <Breadcrumb pageName="Alerts Center" />
      <PageHeader icon={AlertTriangle} title="Alerts Center" subtitle="Fraud signals, overdue payments, low balances, and other system-wide alerts." />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/80">Serious</p>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{counts.serious}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80">Warning</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{counts.warning}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">Informational</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{counts.good}</p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={2} />
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
          <EmptyState icon={CheckCircle2} title="All clear" description="No active alerts right now." />
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, idx) => {
            const style = SEVERITY_STYLE[a.severity] || { icon: Info, classes: "border-slate-100 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300" };
            const Icon = style.icon;
            const content = (
              <div className={`flex items-start gap-3 rounded-2xl border p-4 ${style.classes}`}>
                <Icon className="mt-0.5 size-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="mt-0.5 text-sm opacity-90">{a.message}</p>
                </div>
              </div>
            );
            return a.link ? (
              <Link key={idx} href={a.link} className="block transition hover:opacity-80">{content}</Link>
            ) : (
              <div key={idx}>{content}</div>
            );
          })}
        </div>
      )}
    </>
  );
}
