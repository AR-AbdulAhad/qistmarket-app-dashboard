"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
    CheckCircle2, TrendingUp, AlertCircle, Calculator, ScrollText, DollarSign, Wallet,
    Lock, Unlock, Filter, Building2, Calendar, FileText, CheckCircle, ShieldAlert, ArrowRight
} from "lucide-react";
import Loader from "@/components/common/Loader";
import { toast } from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type Metrics = {
    opening_cash: number;
    down_payments: number;
    installments_received: number;
    cash_from_recovery: number;
    cash_from_delivery: number;
    expenses: number;
    vendor_payments: number;
    cash_transferred_in: number;
    cash_transferred_out: number;
    closing_cash: number;
    expected_cash: number;
    digital_bank_total: number;
    digital_1bill_total: number;
};

type Register = {
    id: number;
    date: string;
    opening_cash: number;
    down_payments: number;
    installments_received: number;
    cash_from_recovery: number;
    cash_from_delivery: number;
    expenses: number;
    vendor_payments: number;
    closing_cash: number;
    expected_cash: number;
    physical_cash: number | null;
    difference: number;
    difference_reason: string | null;
    manager_approval_status: string;
    approved_at?: string | null;
    register_status: string;
    is_locked: boolean;
    settlement_number: string | null;
    settlement_status: string | null;
};

export default function CashRegisterPage() {
    const [registers, setRegisters] = useState<Register[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [todayRegister, setTodayRegister] = useState<Register | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [reconciling, setReconciling] = useState(false);
    const [approving, setApproving] = useState(false);
    const [reopening, setReopening] = useState(false);

    // Filter states
    const [filterType, setFilterType] = useState<"today" | "week" | "month" | "custom">("today");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Physical count form
    const [physicalInput, setPhysicalInput] = useState("");
    const [reasonInput, setReasonInput] = useState("");

    useEffect(() => {
        fetchData(filterType, startDate, endDate);
    }, [filterType]);

    const fetchData = async (type: string, start?: string, end?: string) => {
        setLoading(true);
        try {
            let url = `${API_BASE}/api/outlet/cash-register?filter=${type}`;
            if (type === "custom" && start && end) {
                url += `&startDate=${start}&endDate=${end}`;
            }
            const res = await fetch(url, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                setMetrics(data.metrics);
                setRegisters(data.registers || []);
                setTodayRegister(data.todayRegister || null);
                setIsLocked(data.isLocked || false);
                if (data.todayRegister?.physical_cash !== null && data.todayRegister?.physical_cash !== undefined) {
                    setPhysicalInput(String(data.todayRegister.physical_cash));
                    setReasonInput(data.todayRegister.difference_reason || "");
                }
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load cash register data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncLedger = async () => {
        setCalculating(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-register/calculate`, {
                method: "POST",
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Daily ledger synced successfully!");
                fetchData(filterType, startDate, endDate);
            } else {
                toast.error(data.message || "Failed to sync daily ledger.");
            }
        } catch {
            toast.error("Network error while syncing ledger.");
        } finally {
            setCalculating(false);
        }
    };

    const handleReconcileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!physicalInput || isNaN(Number(physicalInput))) {
            toast.error("Please enter a valid physical cash count.");
            return;
        }

        setReconciling(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-register/reconcile`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    physical_cash: Number(physicalInput),
                    difference_reason: reasonInput
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Physical count submitted for manager approval!");
                fetchData(filterType, startDate, endDate);
            } else {
                toast.error(data.message || "Failed to submit physical count.");
            }
        } catch {
            toast.error("Network error.");
        } finally {
            setReconciling(false);
        }
    };

    const handleApproveRegister = async () => {
        if (!confirm("Are you sure you want to approve and close today's register? This will generate the settlement voucher.")) return;
        setApproving(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-register/approve`, {
                method: "POST",
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Register approved & settlement created!");
                fetchData(filterType, startDate, endDate);
            } else {
                toast.error(data.message || "Failed to approve register.");
            }
        } catch {
            toast.error("Network error.");
        } finally {
            setApproving(false);
        }
    };

    const handleReopenRegister = async () => {
        if (!todayRegister) return;
        if (!confirm("Super Admin Action: Reopen this locked register?")) return;
        setReopening(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-register/reopen`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ register_id: todayRegister.id })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Register unlocked and reopened!");
                fetchData(filterType, startDate, endDate);
            } else {
                toast.error(data.message || "Failed to reopen register.");
            }
        } catch {
            toast.error("Network error.");
        } finally {
            setReopening(false);
        }
    };

    const fields = [
        { key: "opening_cash", label: "Opening Cash" },
        { key: "down_payments", label: "Down Payments" },
        { key: "installments_received", label: "Installments Received" },
        { key: "cash_from_recovery", label: "Cash from Recovery" },
        { key: "cash_from_delivery", label: "Cash from Delivery" },
        { key: "expenses", label: "Expenses (–)" },
        { key: "vendor_payments", label: "Vendor Payments (–)" },
        { key: "closing_cash", label: "Closing / Expected Cash" },
    ];

    if (loading && !metrics) return <Loader text="Loading Cash Register..." />;

    const currentMetrics = metrics || {
        opening_cash: 0, down_payments: 0, installments_received: 0, cash_from_recovery: 0,
        cash_from_delivery: 0, expenses: 0, vendor_payments: 0, cash_transferred_in: 0,
        cash_transferred_out: 0, closing_cash: 0, expected_cash: 0, digital_bank_total: 0, digital_1bill_total: 0
    };

    const expectedVal = currentMetrics.expected_cash;
    const physicalVal = physicalInput !== "" ? Number(physicalInput) : null;
    const diffVal = physicalVal !== null ? physicalVal - expectedVal : 0;

    return (
        <div className="mx-auto max-w-7xl pb-20">
            <Breadcrumb pageName="Cash Register (Daybook)" />

            {/* Top Bar Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Wallet className="text-primary" /> Cash Register & Daybook
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Daily physical cash balance, reconciliation & settlement summary</p>
                </div>
                <div className="flex items-center gap-3">
                    {isLocked && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400">
                            <Lock size={14} /> Locked (10:00 PM / Closed)
                        </span>
                    )}
                    <button
                        onClick={handleSyncLedger}
                        disabled={calculating || isLocked}
                        className="bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all active:scale-95"
                    >
                        <Calculator size={16} className={calculating ? "animate-spin" : ""} />
                        {calculating ? "Processing..." : "Sync Daily Ledger"}
                    </button>
                </div>
            </div>

            {/* Date Range Filter Selector Bar */}
            <div className="mb-8 bg-white dark:bg-boxdark p-3 rounded-2xl border border-stroke dark:border-strokedark shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {(["today", "week", "month", "custom"] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                                filterType === type
                                    ? "bg-primary text-white shadow-md scale-105"
                                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-meta-4"
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {filterType === "custom" && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-stroke dark:border-strokedark rounded-lg px-3 py-1.5 text-xs bg-transparent dark:text-white"
                            />
                            <span className="text-gray-400 text-xs">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-stroke dark:border-strokedark rounded-lg px-3 py-1.5 text-xs bg-transparent dark:text-white"
                            />
                        </div>
                        <button
                            onClick={() => fetchData("custom", startDate, endDate)}
                            className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1"
                        >
                            <Filter size={12} /> Apply
                        </button>
                    </div>
                )}
            </div>

            {/* Standard Accounting Formula Info */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-8 text-xs text-primary flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div className="leading-relaxed">
                    <strong className="font-black uppercase tracking-widest text-[10px] block mb-1">Standard Physical Cash Accounting Formula:</strong>
                    <span>Opening Cash + (Down Payments + Installments + Recovery Cash + Delivery Cash) – (Expenses + Vendor Payments + Refunds) = Expected Physical Cash</span>
                    <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        * Note: Digital Bank Transfers (PKR {currentMetrics.digital_bank_total.toLocaleString()}) and 1Bill Payments (PKR {currentMetrics.digital_1bill_total.toLocaleString()}) are tracked separately and do NOT increase physical drawer cash.
                    </div>
                </div>
            </div>

            {/* Summary Cards Grid */}
            <div className="mb-10">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-4 ml-1">
                    <TrendingUp size={14} /> Master Ledger Cards — Filter: <span className="uppercase text-primary">{filterType}</span>
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
                    {fields.map((f) => {
                        const isClosing = f.key === "closing_cash";
                        const isOutflow = f.key === "expenses" || f.key === "vendor_payments";
                        const isOpening = f.key === "opening_cash";
                        const val = (currentMetrics as any)[f.key] || 0;

                        return (
                            <div
                                key={f.key}
                                className={`rounded-2xl p-4 border shadow-sm flex flex-col justify-between ${
                                    isClosing
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1 border-emerald-200 dark:border-emerald-800/30 border-l-4 border-l-emerald-500"
                                        : isOutflow
                                        ? "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20 border-l-4 border-l-rose-500"
                                        : isOpening
                                        ? "bg-white dark:bg-boxdark border-stroke dark:border-strokedark border-l-4 border-l-primary"
                                        : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark"
                                }`}
                            >
                                <div className="text-[10px] uppercase font-black tracking-widest mb-1 text-gray-500 dark:text-gray-400 opacity-80">
                                    {f.label}
                                </div>
                                <div
                                    className={`text-lg sm:text-xl font-black tabular-nums break-all ${
                                        isClosing
                                            ? "text-emerald-600 dark:text-emerald-400 text-xl sm:text-2xl"
                                            : isOutflow
                                            ? "text-rose-500 dark:text-rose-400"
                                            : isOpening
                                            ? "text-primary"
                                            : "text-gray-800 dark:text-white"
                                    }`}
                                >
                                    PKR {val.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Digital Reporting Badges */}
                {/* COMMENTED OUT — to restore: change false to true (lines 365-374 original) */}
                {false && (
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-300">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl flex items-center gap-2">
                        <Building2 size={14} /> Bank Transfer Collections: <span className="font-black">PKR {currentMetrics.digital_bank_total.toLocaleString()}</span> (Digital Only)
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-xl flex items-center gap-2">
                        <FileText size={14} /> 1Bill Collections: <span className="font-black">PKR {currentMetrics.digital_1bill_total.toLocaleString()}</span> (Digital Only)
                    </div>
                </div>
                )}
            </div>

            {/* Reconciliation & Manager Approval Panel */}
            {/* COMMENTED OUT — to restore: change false to true (lines 379-504 original) */}
            {false && (
            <div className="grid gap-6 lg:grid-cols-2 mb-12">
                {/* Physical Cash Count & Difference Entry */}
                <div className="bg-white dark:bg-boxdark rounded-2xl p-6 border border-stroke dark:border-strokedark shadow-sm">
                    <div className="flex items-center justify-between mb-4 border-b border-stroke dark:border-strokedark pb-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white flex items-center gap-2">
                            <Wallet className="text-primary" size={18} /> Physical Cash Reconciliation
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            todayRegister?.register_status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                            todayRegister?.register_status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            Status: {todayRegister?.register_status || 'Open'}
                        </span>
                    </div>

                    <form onSubmit={handleReconcileSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-meta-4 p-3 rounded-xl">
                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Expected Cash (System)</label>
                                <div className="text-lg font-black text-gray-800 dark:text-white">PKR {expectedVal.toLocaleString()}</div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Physical Cash (Counted)</label>
                                <input
                                    type="number"
                                    placeholder="Enter physical cash"
                                    value={physicalInput}
                                    onChange={(e) => setPhysicalInput(e.target.value)}
                                    disabled={isLocked}
                                    className="w-full rounded-xl border border-stroke dark:border-strokedark bg-transparent px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:text-white"
                                />
                            </div>
                        </div>

                        {physicalVal !== null && (
                            <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                                diffVal === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                diffVal < 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                                <span>Difference Result:</span>
                                <span className="font-black text-sm">
                                    {diffVal === 0 ? "Exact Match (PKR 0)" : diffVal < 0 ? `Shortage of PKR ${Math.abs(diffVal).toLocaleString()}` : `Excess of PKR ${diffVal.toLocaleString()}`}
                                </span>
                            </div>
                        )}

                        {diffVal !== 0 && (
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Difference Reason (Mandatory)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Provide reason for cash variance..."
                                    value={reasonInput}
                                    onChange={(e) => setReasonInput(e.target.value)}
                                    disabled={isLocked}
                                    className="w-full rounded-xl border border-stroke dark:border-strokedark bg-transparent p-3 text-xs font-medium outline-none focus:border-primary dark:text-white"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={reconciling || isLocked}
                            className="w-full bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                            <CheckCircle2 size={16} />
                            {reconciling ? "Submitting..." : "Submit Count for Approval"}
                        </button>
                    </form>
                </div>

                {/* Manager Approval & Settlement Voucher Card */}
                <div className="bg-white dark:bg-boxdark rounded-2xl p-6 border border-stroke dark:border-strokedark shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-stroke dark:border-strokedark pb-3">
                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="text-emerald-500" size={18} /> Manager Settlement &amp; Approval
                            </h3>
                            <span className="text-[10px] font-bold text-gray-400">Lock Rule: 10:00 PM PKT</span>
                        </div>

                        {todayRegister?.settlement_number ? (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 text-emerald-800 dark:text-emerald-300 space-y-2 mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase">Settlement Voucher</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">Closed</span>
                                </div>
                                <div className="text-lg font-black">{todayRegister.settlement_number}</div>
                                <div className="text-[11px] font-medium flex items-center gap-4">
                                    <span>Status: <strong>{todayRegister.settlement_status || "Pending"}</strong></span>
                                    <span>Locked At: <strong>{todayRegister.approved_at ? new Date(todayRegister.approved_at).toLocaleTimeString() : '10:00 PM'}</strong></span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 dark:bg-meta-4 rounded-xl text-xs text-gray-500 space-y-2 mb-4">
                                <p>Once the Manager approves the physical cash count, today&apos;s register will be closed, locked, and a unique Settlement Voucher will be generated for the Accounts panel.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {(!todayRegister?.is_locked && todayRegister?.register_status !== 'closed') ? (
                            <button
                                onClick={handleApproveRegister}
                                disabled={approving}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                            >
                                <CheckCircle size={16} />
                                {approving ? "Approving..." : "Approve Register & Generate Settlement"}
                            </button>
                        ) : (
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    onClick={handleReopenRegister}
                                    disabled={reopening}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow"
                                >
                                    <Unlock size={14} /> {reopening ? "Reopening..." : "Super Admin: Reopen Register"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* History Archives Table */}
            <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden">
                <div className="px-5 py-4 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4 flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <ScrollText size={14} /> Register Archives
                    </h2>
                    <span className="text-[10px] font-bold text-gray-400">Total Entries: {registers.length}</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark">
                            <tr className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="px-5 py-4">Date</th>
                                <th className="px-5 py-4 text-right">Opening</th>
                                <th className="px-5 py-4 text-right">Down Pay</th>
                                <th className="px-5 py-4 text-right">Installments</th>
                                <th className="px-5 py-4 text-right">Expenses</th>
                                <th className="px-5 py-4 text-right">Expected</th>
                                <th className="px-5 py-4 text-right">Physical</th>
                                <th className="px-5 py-4 text-right">Diff</th>
                                <th className="px-5 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stroke dark:divide-strokedark">
                            {registers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-16 text-gray-400 opacity-60">
                                        <DollarSign size={36} className="mx-auto mb-3" />
                                        <div className="font-bold uppercase tracking-widest text-xs">No register archives found.</div>
                                    </td>
                                </tr>
                            ) : (
                                registers.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-all font-medium">
                                        <td className="px-5 py-4 text-gray-800 dark:text-white font-bold">
                                            {new Date(r.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="px-5 py-4 text-right text-gray-500 tabular-nums">PKR {r.opening_cash?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right text-gray-500 tabular-nums">PKR {r.down_payments?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right text-gray-500 tabular-nums">PKR {r.installments_received?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right text-rose-500 dark:text-rose-400 tabular-nums">PKR {r.expenses?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right font-bold text-gray-800 dark:text-white tabular-nums">PKR {(r.expected_cash || r.closing_cash)?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right text-emerald-600 font-bold tabular-nums">
                                            {r.physical_cash !== null ? `PKR ${r.physical_cash.toLocaleString()}` : "—"}
                                        </td>
                                        <td className={`px-5 py-4 text-right font-bold tabular-nums ${
                                            r.difference < 0 ? "text-rose-500" : r.difference > 0 ? "text-amber-500" : "text-emerald-500"
                                        }`}>
                                            PKR {r.difference?.toLocaleString() || 0}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                                                r.register_status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                                                r.register_status === 'pending_approval' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {r.register_status || 'Open'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
