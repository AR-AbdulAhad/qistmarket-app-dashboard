"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Package, Boxes, CheckCircle2, ShoppingBag, Coins, Warehouse, ArrowLeftRight, Undo2, Search, Smartphone } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OutletSelector from "@/components/common/OutletSelector";
import PageHeader from "@/components/Accounts/PageHeader";
import EmptyState from "@/components/Accounts/EmptyState";
import StatCard, { PKR } from "@/components/Accounts/StatCard";
import { StatCardSkeleton, TableSkeleton } from "@/components/Accounts/Skeleton";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const authHeaders = () => ({ Authorization: `Bearer ${Cookies.get("auth_token")}` });

interface StockRow { product: string; total: number; inStock: number; sold: number; valuation: number }
interface Transfer { id: number; status: string; quantity_transferred: number; created_at: string; product_name: string; imei_serial: string; from: string; to: string }
interface ReturnItem { id: number; order_ref: string; customer_name: string; outlet_name: string; type: string; status: string; refund_amount: number; created_at: string }
interface ImeiResult { inventory: any[]; payTriggerDevice: any; returns: any[] }

const TABS = [
  { key: "outlet" as const, label: "Outlet Stock", icon: Package },
  { key: "warehouse" as const, label: "Warehouse", icon: Warehouse },
  { key: "transfers" as const, label: "Transfers", icon: ArrowLeftRight },
  { key: "returns" as const, label: "Returns", icon: Undo2 },
  { key: "imei" as const, label: "IMEI Search", icon: Smartphone },
];

export default function AccountsStockSummaryPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("outlet");
  const [productSearch, setProductSearch] = useState("");
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [outletId, setOutletId] = useState("all");

  const [warehouseRows, setWarehouseRows] = useState<StockRow[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);

  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);

  const [imei, setImei] = useState("");
  const [imeiResult, setImeiResult] = useState<ImeiResult | null>(null);
  const [imeiSearching, setImeiSearching] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/outlet-reports/stock-summary?outletId=${outletId}`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((json) => { if (json.success) setRows(json.data); })
      .catch((err) => console.error("Failed to load stock summary:", err))
      .finally(() => setLoading(false));
  }, [outletId]);

  useEffect(() => {
    if (tab === "warehouse") {
      setWarehouseLoading(true);
      fetch(`${BACKEND_URL}/api/accounts/stock/warehouse`, { headers: authHeaders() }).then((r) => r.json()).then((json) => { if (json.success) setWarehouseRows(json.data.summary); }).finally(() => setWarehouseLoading(false));
    }
    if (tab === "transfers") {
      setTransfersLoading(true);
      fetch(`${BACKEND_URL}/api/accounts/stock/transfers`, { headers: authHeaders() }).then((r) => r.json()).then((json) => { if (json.success) setTransfers(json.data); }).finally(() => setTransfersLoading(false));
    }
    if (tab === "returns") {
      setReturnsLoading(true);
      fetch(`${BACKEND_URL}/api/accounts/stock/returns`, { headers: authHeaders() }).then((r) => r.json()).then((json) => { if (json.success) setReturns(json.data.items); }).finally(() => setReturnsLoading(false));
    }
  }, [tab]);

  const handleImeiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imei.trim().length < 4) return;
    setImeiSearching(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/accounts/stock/imei/${imei.trim()}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setImeiResult(json.data);
    } finally {
      setImeiSearching(false);
    }
  };

  const totals = rows.reduce((acc, r) => ({ total: acc.total + r.total, inStock: acc.inStock + r.inStock, sold: acc.sold + r.sold, valuation: acc.valuation + r.valuation }), { total: 0, inStock: 0, sold: 0, valuation: 0 });

  return (
    <>
      <Breadcrumb pageName="Stock Summary" />
      <PageHeader icon={Package} title="Stock Summary" subtitle="Inventory levels, transfers, returns, and IMEI tracking across the business." actions={tab === "outlet" ? <OutletSelector selectedId={outletId} onSelect={setOutletId} /> : undefined} />

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-dark-3 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === t.key ? "bg-white text-[#ff3d3d] shadow-sm dark:bg-boxdark" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
            <t.icon className="size-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "outlet" && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {loading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : (
              <>
                <StatCard icon={Boxes} label="Total Items" value={totals.total} accent="text-slate-600" bg="bg-slate-100 dark:bg-white/10" bar="bg-slate-400" />
                <StatCard icon={CheckCircle2} label="In Stock" value={totals.inStock} accent="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-500/10" bar="bg-emerald-500" />
                <StatCard icon={ShoppingBag} label="Sold" value={totals.sold} accent="text-blue-600" bg="bg-blue-50 dark:bg-blue-500/10" bar="bg-blue-500" />
                <StatCard icon={Coins} label="Valuation" value={PKR(totals.valuation)} accent="text-orange-600" bg="bg-orange-50 dark:bg-orange-500/10" bar="bg-orange-500" />
              </>
            )}
          </div>
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search product..." className="w-full rounded-xl border border-stroke bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
          </div>
          {loading ? <TableSkeleton /> : rows.filter((r) => r.product.toLowerCase().includes(productSearch.toLowerCase())).length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400"><tr><th className="px-4 py-3 font-bold">Product</th><th className="px-4 py-3 text-right font-bold">Total</th><th className="px-4 py-3 text-right font-bold">In Stock</th><th className="px-4 py-3 text-right font-bold">Sold</th><th className="px-4 py-3 text-right font-bold">Valuation</th></tr></thead>
                <tbody>{rows.filter((r) => r.product.toLowerCase().includes(productSearch.toLowerCase())).map((r) => (
                  <tr key={r.product} className="border-t border-slate-50 dark:border-white/5">
                    <td className="px-4 py-3.5 font-medium text-dark dark:text-white">{r.product}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{r.total}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{r.inStock}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{r.sold}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-bold text-dark dark:text-white">{PKR(r.valuation)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={Package} title="No inventory data" /></div>}
        </>
      )}

      {tab === "warehouse" && (
        warehouseLoading ? <TableSkeleton /> : warehouseRows.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400"><tr><th className="px-4 py-3 font-bold">Product</th><th className="px-4 py-3 text-right font-bold">Total</th><th className="px-4 py-3 text-right font-bold">In Stock</th><th className="px-4 py-3 text-right font-bold">Valuation</th></tr></thead>
              <tbody>{warehouseRows.map((r) => (
                <tr key={r.product} className="border-t border-slate-50 dark:border-white/5">
                  <td className="px-4 py-3.5 font-medium text-dark dark:text-white">{r.product}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{r.total}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{r.inStock}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-dark dark:text-white">{PKR(r.valuation)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={Warehouse} title="No warehouse stock" description="No outlets are tagged as a warehouse yet, or the warehouse has no inventory." /></div>
      )}

      {tab === "transfers" && (
        transfersLoading ? <TableSkeleton /> : transfers.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400"><tr><th className="px-4 py-3 font-bold">Product</th><th className="px-4 py-3 font-bold">IMEI</th><th className="px-4 py-3 font-bold">From</th><th className="px-4 py-3 font-bold">To</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold">Date</th></tr></thead>
              <tbody>{transfers.map((t) => (
                <tr key={t.id} className="border-t border-slate-50 dark:border-white/5">
                  <td className="px-4 py-3.5 font-medium text-dark dark:text-white">{t.product_name}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{t.imei_serial}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{t.from}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{t.to}</td>
                  <td className="px-4 py-3.5 capitalize text-gray-500">{t.status}</td>
                  <td className="px-4 py-3.5 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={ArrowLeftRight} title="No stock transfers recorded" /></div>
      )}

      {tab === "returns" && (
        returnsLoading ? <TableSkeleton /> : returns.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400"><tr><th className="px-4 py-3 font-bold">Order Ref</th><th className="px-4 py-3 font-bold">Customer</th><th className="px-4 py-3 font-bold">Outlet</th><th className="px-4 py-3 font-bold">Type</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 text-right font-bold">Refund</th></tr></thead>
              <tbody>{returns.map((r) => (
                <tr key={r.id} className="border-t border-slate-50 dark:border-white/5">
                  <td className="px-4 py-3.5 font-semibold text-dark dark:text-white">{r.order_ref}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{r.customer_name}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{r.outlet_name}</td>
                  <td className="px-4 py-3.5 text-gray-500">{r.type}</td>
                  <td className="px-4 py-3.5 capitalize text-gray-500">{r.status}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-rose-600">{PKR(r.refund_amount)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark"><EmptyState icon={Undo2} title="No return items recorded" /></div>
      )}

      {tab === "imei" && (
        <div className="space-y-6">
          <form onSubmit={handleImeiSearch} className="flex gap-2">
            <input value={imei} onChange={(e) => setImei(e.target.value)} placeholder="Enter IMEI (or partial)" className="flex-1 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
            <button type="submit" disabled={imeiSearching} className="flex items-center gap-1.5 rounded-xl bg-[#ff3d3d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-50"><Search className="size-4" /> Search</button>
          </form>

          {imeiResult && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-boxdark">
                <h3 className="mb-3 text-sm font-bold text-dark dark:text-white">Inventory Records</h3>
                {imeiResult.inventory.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {imeiResult.inventory.map((i: any) => <div key={i.id} className="flex justify-between border-b border-slate-50 pb-2 dark:border-white/5"><span>{i.product_name} — {i.imei_serial}</span><span className="text-gray-500">{i.status} · {i.outlet_name}</span></div>)}
                  </div>
                ) : <p className="text-sm text-gray-400">No inventory match.</p>}
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-boxdark">
                <h3 className="mb-3 text-sm font-bold text-dark dark:text-white">PayTrigger Device</h3>
                {imeiResult.payTriggerDevice ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Lock status: <strong>{imeiResult.payTriggerDevice.lock_status}</strong> · Order: {imeiResult.payTriggerDevice.order_ref}</div>
                ) : <p className="text-sm text-gray-400">Not enrolled in PayTrigger.</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
