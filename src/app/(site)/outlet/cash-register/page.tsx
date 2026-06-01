"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
    CreditCard, ArrowUpRight, CheckCircle2, TrendingUp, AlertCircle, Calculator, ScrollText, DollarSign, Wallet
} from "lucide-react";
import Loader from "@/components/common/Loader";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

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
};

export default function CashRegisterPage() {
    const [registers, setRegisters] = useState<Register[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => { fetchRegisters(); }, []);

    const fetchRegisters = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-register`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setRegisters(data.registers);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCalculate = async () => {
        setCalculating(true); setMessage("");
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-register/calculate`, { method: "POST", headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) { setMessage("Today's cash register calculated!"); fetchRegisters(); }
            else setMessage(data.message || "Failed.");
        } catch { setMessage("Network error."); } finally { setCalculating(false); }
    };

    const fields = [
        { key: "opening_cash", label: "Opening Cash" },
        { key: "down_payments", label: "Down Payments" },
        { key: "installments_received", label: "Installments Received" },
        { key: "cash_from_recovery", label: "Cash from Recovery Officers" },
        { key: "cash_from_delivery", label: "Cash from Delivery Officers" },
        { key: "expenses", label: "Expenses (–)" },
        { key: "vendor_payments", label: "Vendor Payments (–)" },
        { key: "closing_cash", label: "Closing Cash" },
    ];

    const latest = registers[0];

    if (loading) return <Loader text="Loading Cash Register..." />;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Cash Register (Daybook)" />

            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Wallet className="text-primary" /> Cash Register & Daybook
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Daily physical cash balance and transaction summary</p>
                </div>
                <button
                    onClick={handleCalculate}
                    disabled={calculating}
                    className="bg-primary hover:bg-opacity-90 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg transition-all active:scale-95"
                >
                    <Calculator size={18} className={calculating ? "animate-spin" : ""} />
                    {calculating ? "Processing..." : "Sync Daily Ledger"}
                </button>
            </div>

            {message && <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 text-xs font-bold border border-green-100 flex items-center gap-2 animate-head-shake"><CheckCircle2 size={16} /> {message}</div>}

            {/* Formula Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-8 text-sm text-primary flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div>
                    <strong className="font-black uppercase tracking-widest text-[11px] block mb-1">Standard Accounting Formula:</strong>
                    <span className="font-bold">Opening Cash + (Down Payments + Installments Received + Delivery Cash + Recovery Cash) – (Expenses + Vendor Payments) = Closing Cash</span>
                </div>
            </div>
            <>
                {/* Today's summary */}
                {latest && (
                    <div className="mb-8">
                        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-4 ml-1">
                            <TrendingUp size={14} /> Master Ledger — {new Date(latest.date).toLocaleDateString("en-PK", { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                            {fields.map(f => {
                                const isClosing = f.key === "closing_cash";
                                const isOutflow = f.key === "expenses" || f.key === "vendor_payments";
                                const isOpening = f.key === "opening_cash";

                                return (
                                    <div key={f.key} className={`rounded-2xl p-4 border shadow-sm ${isClosing ? "bg-green-50 dark:bg-green-900/20 col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1 border-green-200 dark:border-green-800/30 border-l-4 border-l-green-500" :
                                            isOutflow ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 border-l-4 border-l-red-500" :
                                                isOpening ? "bg-white dark:bg-boxdark border-stroke dark:border-strokedark border-l-4 border-l-primary" :
                                                    "bg-white dark:bg-boxdark border-stroke dark:border-strokedark"
                                        }`}>
                                        <div className="text-[10px] uppercase font-black tracking-widest mb-1 text-gray-500 dark:text-gray-400 opacity-80">{f.label}</div>
                                        <div className={`text-xl font-black tabular-nums ${isClosing ? "text-green-600 dark:text-green-400 text-2xl" :
                                                isOutflow ? "text-red-500 dark:text-red-400" :
                                                    isOpening ? "text-primary" :
                                                        "text-gray-800 dark:text-white"
                                            }`}>
                                            PKR {((latest as any)[f.key] || 0).toLocaleString()}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* History */}
                <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden mb-20">
                    <div className="px-5 py-4 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <ScrollText size={14} /> Register Archives
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark z-10 shadow-sm">
                                <tr className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="px-5 py-4">Date</th>
                                    <th className="px-5 py-4 text-right">Opening</th>
                                    <th className="px-5 py-4 text-right">Installments</th>
                                    <th className="px-5 py-4 text-right">Expenses</th>
                                    <th className="px-5 py-4 text-right">Vendors</th>
                                    <th className="px-5 py-4 text-right">Closing</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stroke dark:divide-strokedark">
                                {registers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-gray-400 opacity-60">
                                            <DollarSign size={40} className="mx-auto mb-4" />
                                            <div className="font-bold uppercase tracking-widest text-xs">No register entries found.</div>
                                        </td>
                                    </tr>
                                ) : registers.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-all font-medium">
                                        <td className="px-5 py-4 text-gray-800 dark:text-white font-bold">{new Date(r.date).toLocaleDateString("en-PK", { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-5 py-4 text-right text-gray-500 tabular-nums">PKR {r.opening_cash?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right text-gray-500 tabular-nums">PKR {r.installments_received?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right text-red-500 dark:text-red-400 tabular-nums">PKR {r.expenses?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right text-red-500 dark:text-red-400 tabular-nums">PKR {(r.vendor_payments || 0).toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right font-black text-green-600 dark:text-green-400 tabular-nums text-sm bg-green-50/50 dark:bg-green-900/10">PKR {r.closing_cash?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        </div>
    );
}
