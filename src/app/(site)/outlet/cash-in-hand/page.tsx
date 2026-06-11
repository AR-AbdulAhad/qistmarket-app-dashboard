"use client";

import { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import {
    Search, RefreshCw, Clock, DollarSign,
    Phone, User, Wallet, CreditCard,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { toast } from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type CashEntry = {
    id: number;
    amount: number;
    balance: number;
    cash_type: string;
    status: string;
    payment_method: string;
    officer: {
        full_name: string;
        username: string;
        phone: string;
        role: string;
    };
    outlet: { name: string; code: string } | null;
};

function Avatar({ name }: { name: string }) {
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];
    const color = colors[name.length % colors.length];
    return (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color} text-xs font-bold text-white ring-2 ring-white dark:ring-gray-700`}>
            {initials}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    if (s === "pending") return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Clock size={12} /> Pending</span>;
    if (s === "submitted") return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">Submitted</span>;
    if (s === "verified") return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Verified</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">{status}</span>;
}

export default function PendingCashPage() {
    const [entries, setEntries] = useState<CashEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchCollections();
        const handleRefresh = () => fetchCollections();
        window.addEventListener("refreshCashList", handleRefresh);
        return () => window.removeEventListener("refreshCashList", handleRefresh);
    }, []);

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/global-cash-in-hand`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setEntries(data.data);
        } catch {
            toast.error("Failed to fetch pending collections");
        } finally {
            setLoading(false);
        }
    };

    const groupedData = useMemo(() => {
        const q = search.toLowerCase();
        const filtered = entries.filter(e =>
            e.officer?.full_name?.toLowerCase().includes(q) ||
            e.officer?.username?.toLowerCase().includes(q) ||
            e.officer?.role?.toLowerCase().includes(q) ||
            e.cash_type?.toLowerCase().includes(q)
        );

        const groups: Record<string, { officer: CashEntry["officer"]; total_amount: number; entries: CashEntry[] }> = {};
        filtered.forEach(e => {
            const key = e.officer.full_name;
            if (!groups[key]) {
                groups[key] = { officer: e.officer, total_amount: 0, entries: [] };
            }
            groups[key].total_amount += e.balance;
            groups[key].entries.push(e);
        });

        return Object.values(groups).sort((a, b) => b.total_amount - a.total_amount);
    }, [entries, search]);

    const grandTotal = entries.reduce((sum, e) => sum + e.balance, 0);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Breadcrumb pageName="Pending Cash Collections" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <DollarSign size={24} className="text-primary" /> Pending Collections
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Cash held by officers assigned to this outlet awaiting submission.
                    </p>
                </div>
                <button
                    onClick={fetchCollections}
                    className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-meta-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark p-4 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="relative w-full lg:max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, username, role, cash type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-stroke dark:border-strokedark rounded-lg pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-form-input focus:border-primary outline-none dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-6 text-sm flex-wrap">
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500 dark:text-gray-400">Officers</span>
                        <span className="font-bold text-lg text-gray-800 dark:text-white">{groupedData.length}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500 dark:text-gray-400">Grand Total</span>
                        <span className="font-black text-xl text-primary">PKR {grandTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {loading && entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
                    <p className="text-sm font-medium">Loading collections...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupedData.length === 0 ? (
                        <div className="col-span-full bg-white dark:bg-boxdark rounded-2xl border border-dashed border-stroke dark:border-strokedark p-20 text-center text-gray-500">
                            <Wallet size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            No pending collections found.
                        </div>
                    ) : groupedData.map((group) => (
                        <div key={group.officer.full_name} className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar name={group.officer.full_name} />
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 truncate">{group.officer.full_name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                            <span className="flex items-center gap-1"><User size={11} /> @{group.officer.username}</span>
                                            <span className="flex items-center gap-1"><Phone size={11} /> {group.officer.phone}</span>
                                        </div>
                                        <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{group.officer.role}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Pending</p>
                                    <p className="text-lg font-black text-primary">PKR {group.total_amount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
