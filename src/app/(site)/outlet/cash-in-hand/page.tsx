"use client";

import { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import {
    Search, RefreshCw, CheckCircle2, User, Clock, Package, DollarSign
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
    status: string;
    created_at: string;
    customer_name: string;
    product_name: string;
    imei_serial: string;
    color_variant: string;
    delivery_officer: {
        full_name: string;
        phone: string;
    };
    order: {
        order_ref: string;
        delivery?: {
            selected_plan: any;
        }
    };
    outlet_id?: number | null;
};

type GroupedOfficer = {
    officer_name: string;
    officer_phone: string;
    total_amount: number;
    entries: CashEntry[];
    last_activity: string;
};

export default function PendingCashPage() {
    const [entries, setEntries] = useState<CashEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchCollections();

        // Listen for refresh events from the global popup
        const handleRefresh = () => fetchCollections();
        window.addEventListener("refreshCashList", handleRefresh);
        return () => window.removeEventListener("refreshCashList", handleRefresh);
    }, []);

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/global-cash-in-hand`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                setEntries(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch pending collections");
        } finally {
            setLoading(false);
        }
    };

    const groupedData = useMemo(() => {
        const filtered = entries.filter(e =>
            e.delivery_officer.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            e.order.order_ref?.toLowerCase().includes(search.toLowerCase()) ||
            e.product_name?.toLowerCase().includes(search.toLowerCase()) ||
            e.customer_name?.toLowerCase().includes(search.toLowerCase())
        );

        const groups: Record<string, GroupedOfficer> = {};
        filtered.forEach(e => {
            const name = e.delivery_officer.full_name;
            if (!groups[name]) {
                groups[name] = {
                    officer_name: name,
                    officer_phone: e.delivery_officer.phone,
                    total_amount: 0,
                    entries: [],
                    last_activity: e.created_at
                };
            }
            groups[name].total_amount += e.amount;
            groups[name].entries.push(e);
            if (new Date(e.created_at) > new Date(groups[name].last_activity)) {
                groups[name].last_activity = e.created_at;
            }
        });

        return Object.values(groups).sort((a, b) => b.total_amount - a.total_amount);
    }, [entries, search]);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Breadcrumb pageName="Pending Cash Collections" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <DollarSign size={24} className="text-primary" /> Pending Collections
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Showing all cash currently held by delivery officers that needs to be submitted to an outlet.
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
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by officer name, order ref, product..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-stroke dark:border-strokedark rounded-lg pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-form-input focus:border-primary outline-none dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500 dark:text-gray-400">Grand Total Pending</span>
                        <span className="font-black text-xl text-primary">PKR {entries.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {loading && entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
                    <p className="text-sm font-medium">Loading collections...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {groupedData.length === 0 ? (
                        <div className="col-span-full bg-white dark:bg-boxdark rounded-2xl border border-dashed border-stroke dark:border-strokedark p-20 text-center text-gray-500">
                            No pending collections found.
                        </div>
                    ) : groupedData.map((group) => (
                        <div key={group.officer_name} className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <div className="p-5 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/20">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200">{group.officer_name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{group.officer_phone}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-black tracking-wider">Total Cash</p>
                                        <p className="text-lg font-black text-primary">PKR {group.total_amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mt-4">
                                    <Clock size={12} /> Last activity: {new Date(group.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            <div className="p-5">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Snapshots</p>
                                <div className="space-y-3 max-h-72 overflow-y-auto pr-2 scrollbar-hide">
                                    {group.entries.map((item) => (
                                        <div key={item.id} className="p-4 bg-gray-50/50 dark:bg-meta-4/10 rounded-xl border border-gray-100 dark:border-strokedark/30 group-hover:border-primary/20 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-black text-gray-800 dark:text-gray-200 truncate">{item.customer_name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">#{item.order?.order_ref || "N/A"}</p>
                                                </div>
                                                <p className="text-xs font-black text-primary whitespace-nowrap ml-2">PKR {item.amount.toLocaleString()}</p>
                                            </div>
                                            <div className="flex flex-col gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                   <Package size={12} className="text-gray-400" />
                                                   <span className="font-medium truncate">{item.product_name}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-white dark:bg-boxdark p-1.5 rounded-lg border border-gray-100 dark:border-strokedark/20">
                                                   <span>IMEI: {item.imei_serial || "N/A"}</span>
                                                   <span className="bg-gray-100 dark:bg-meta-4 px-1.5 py-0.5 rounded text-[9px] font-bold">{item.color_variant || "Standard"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-5 border-t border-stroke dark:border-strokedark">
                                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-primary" />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Ready for collection</span>
                                        </div>
                                        <p className="text-[10px] text-primary font-black uppercase tracking-tighter italic">Waiting for Officer</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
