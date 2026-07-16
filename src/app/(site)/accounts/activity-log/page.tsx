"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { ShieldAlert, Search, ChevronLeft, ChevronRight, LogIn, AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PageHeader from "@/components/Accounts/PageHeader";
import EmptyState from "@/components/Accounts/EmptyState";
import { TableSkeleton } from "@/components/Accounts/Skeleton";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const authHeaders = () => ({ Authorization: `Bearer ${Cookies.get("auth_token")}` });

interface LogEntry { id: number; action: string; details: string; created_at: string; ip_address: string | null; device_info: string | null; user: { username: string; full_name: string } | null; outlet: { name: string; code: string } | null }
interface FraudAlert { severity: string; type: string; title: string; message: string }

const ACTION_COLORS: Record<string, string> = {
  BANK_TRANSACTION: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10",
  BANK_ACCOUNT_CREATED: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10",
  MANUAL_BLACKLIST: "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
  MANUAL_WHITELIST: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  EXPENSE_ENTRY: "bg-orange-50 text-orange-600 dark:bg-orange-500/10",
  EXPENSE_DELETION: "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
  LOGIN_SUCCESS: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  LOGIN_FAILED: "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
};
const defaultActionColor = "bg-slate-100 text-slate-600 dark:bg-white/10";

const SEVERITY_ICON: Record<string, any> = { warning: AlertTriangle, serious: AlertTriangle, critical: AlertTriangle, good: CheckCircle2 };
const SEVERITY_STYLE: Record<string, string> = {
  warning: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10",
  serious: "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10",
  critical: "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10",
  good: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10",
};

const TABS = [
  { key: "all" as const, label: "All Activity", icon: ShieldAlert },
  { key: "logins" as const, label: "Login History", icon: LogIn },
  { key: "fraud" as const, label: "Fraud Alerts", icon: AlertTriangle },
];

export default function ActivityLogPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [logins, setLogins] = useState<LogEntry[]>([]);
  const [loginsLoading, setLoginsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<"" | "success" | "failed">("");

  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [fraudLoading, setFraudLoading] = useState(false);

  useEffect(() => {
    if (tab !== "all") return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("search", search);
    fetch(`${BACKEND_URL}/api/accounts/activity-logs?${params}`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((json) => { if (json.success) { setLogs(json.logs); setTotalPages(json.pagination.totalPages || 1); } })
      .catch((err) => console.error("Failed to load activity log:", err))
      .finally(() => setLoading(false));
  }, [page, search, tab]);

  useEffect(() => {
    if (tab === "logins") {
      setLoginsLoading(true);
      const params = new URLSearchParams({ limit: "50" });
      if (loginStatus) params.set("status", loginStatus);
      fetch(`${BACKEND_URL}/api/accounts/audit/login-history?${params}`, { headers: authHeaders() })
        .then((res) => res.json())
        .then((json) => { if (json.success) setLogins(json.data); })
        .finally(() => setLoginsLoading(false));
    }
    if (tab === "fraud") {
      setFraudLoading(true);
      fetch(`${BACKEND_URL}/api/accounts/audit/fraud-alerts`, { headers: authHeaders() })
        .then((res) => res.json())
        .then((json) => { if (json.success) setFraudAlerts(json.data.alerts); })
        .finally(() => setFraudLoading(false));
    }
  }, [tab, loginStatus]);

  return (
    <>
      <Breadcrumb pageName="Activity Log" />
      <PageHeader icon={ShieldAlert} title="Activity Log" subtitle="Audit trail, login history, and fraud monitoring across the business." />

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-dark-3 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === t.key ? "bg-white text-[#ff3d3d] shadow-sm dark:bg-boxdark" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
            <t.icon className="size-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by action or user..." className="w-full rounded-xl border border-stroke bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
            </div>
          </div>

          {loading ? <TableSkeleton /> : logs.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400">
                    <tr><th className="px-4 py-3 font-bold">Date</th><th className="px-4 py-3 font-bold">Action</th><th className="px-4 py-3 font-bold">Details</th><th className="px-4 py-3 font-bold">User</th><th className="px-4 py-3 font-bold">Outlet</th></tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t border-slate-50 transition hover:bg-slate-50/70 dark:border-white/5 dark:hover:bg-white/5">
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ACTION_COLORS[log.action] || defaultActionColor}`}>{log.action}</span></td>
                        <td className="px-4 py-3.5 max-w-md truncate text-gray-600 dark:text-gray-300" title={log.details}>{log.details}</td>
                        <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{log.user?.full_name || "—"}</td>
                        <td className="px-4 py-3.5 text-gray-500">{log.outlet?.name || "Head Office"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-white/5">
                <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-40 dark:bg-white/10"><ChevronLeft className="size-4" /></button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-40 dark:bg-white/10"><ChevronRight className="size-4" /></button>
                </div>
              </div>
            </div>
          ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={ShieldAlert} title="No activity recorded yet" /></div>}
        </>
      )}

      {tab === "logins" && (
        <>
          <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-dark-3 w-fit">
            {(["", "success", "failed"] as const).map((s) => (
              <button key={s} onClick={() => setLoginStatus(s)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${loginStatus === s ? "bg-white text-[#ff3d3d] shadow-sm dark:bg-boxdark" : "text-gray-500"}`}>{s || "All"}</button>
            ))}
          </div>
          {loginsLoading ? <TableSkeleton /> : logins.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400"><tr><th className="px-4 py-3 font-bold">Date</th><th className="px-4 py-3 font-bold">User</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold">IP Address</th><th className="px-4 py-3 font-bold">Device</th></tr></thead>
                <tbody>
                  {logins.map((log) => (
                    <tr key={log.id} className="border-t border-slate-50 dark:border-white/5">
                      <td className="px-4 py-3.5 whitespace-nowrap text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-medium text-dark dark:text-white">{log.user?.full_name || "—"}</td>
                      <td className="px-4 py-3.5">
                        {log.action === "LOGIN_SUCCESS" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10"><CheckCircle2 className="size-3" /> Success</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-500/10"><XCircle className="size-3" /> Failed</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{log.ip_address || "—"}</td>
                      <td className="px-4 py-3.5 max-w-xs truncate text-xs text-gray-400" title={log.device_info || ""}>{log.device_info || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={LogIn} title="No login history yet" /></div>}
        </>
      )}

      {tab === "fraud" && (
        fraudLoading ? <TableSkeleton /> : fraudAlerts.length > 0 ? (
          <div className="space-y-2">
            {fraudAlerts.map((a, i) => {
              const Icon = SEVERITY_ICON[a.severity] || Info;
              return (
                <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.warning}`}>
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <div><strong className="font-bold">{a.title}</strong><p className="mt-0.5">{a.message}</p></div>
                </div>
              );
            })}
          </div>
        ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={CheckCircle2} title="No fraud signals detected" description="All login patterns, blacklist activity, and cash submissions look normal." /></div>
      )}
    </>
  );
}
