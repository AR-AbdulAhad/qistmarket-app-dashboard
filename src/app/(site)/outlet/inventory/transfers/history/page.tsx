"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
    History, Package, Truck, Store, ChevronDown, ChevronRight, Building2
} from "lucide-react";
import Loader from "@/components/common/Loader";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

interface TransferRecord {
    id: number;
    from_type: string;
    from_id: number;
    to_type: string;
    to_id: number;
    inventory_id: number;
    quantity_transferred: number;
    status: string;
    created_at: string;
    recipient_name: string;
    inventory: {
        product_name: string;
        category: string;
        color_variant?: string;
        imei_serial?: string;
        purchase_price: number;
        quantity: number;
    };
}

// Grouped by product_name + color_variant + recipient
interface GroupedTransfer {
    key: string;
    product_name: string;
    category: string;
    color_variant?: string;
    to_type: string;
    recipient_name: string;
    total_quantity: number;
    latest_at: string;
    records: TransferRecord[];
}

function formatDate(d: string) {
    return new Date(d).toLocaleString("en-PK", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

export default function TransferHistoryPage() {
    const [loading, setLoading] = useState(true);
    const [transfers, setTransfers] = useState<TransferRecord[]>([]);
    const [activeTab, setActiveTab] = useState<"Delivery Officer" | "Outlet">("Delivery Officer");
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(20);
    const [totalItemsCount, setTotalItemsCount] = useState(0);
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                let url = `${API_BASE}/api/outlet/inventory/transfers/history?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&to_type=${activeTab}`;
                if (startDate) url += `&startDate=${startDate}`;
                if (endDate) url += `&endDate=${endDate}`;
                
                const res = await fetch(url, { headers: getAuthHeaders() });
                const json = await res.json();
                if (json.success) {
                    setTransfers(json.transfers);
                    setTotalPages(json.pagination.totalPages);
                    setTotalItemsCount(json.pagination.total);
                }
            } catch {
                console.error("Failed to load transfer history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [page, search, activeTab, startDate, endDate]);

    const toggleExpand = (key: string) => {
        setExpandedKeys(prev => {
            const n = new Set(prev);
            n.has(key) ? n.delete(key) : n.add(key);
            return n;
        });
    };

    // Group by product+variant+recipient
    const grouped = useMemo<GroupedTransfer[]>(() => {
        // Backend now handles filtering by to_type, but we'll keep a sanity check
        const filtered = transfers; 
        const map = new Map<string, GroupedTransfer>();

        for (const t of filtered) {
            // Group by product name and recipient
            const key = `${t.inventory.product_name}||${t.to_id}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    product_name: t.inventory.product_name,
                    category: t.inventory.category,
                    color_variant: undefined,
                    to_type: t.to_type,
                    recipient_name: t.recipient_name,
                    total_quantity: 0,
                    latest_at: t.created_at,
                    records: [],
                });
            }
            const grp = map.get(key)!;
            grp.total_quantity += t.quantity_transferred || 1;
            if (new Date(t.created_at) > new Date(grp.latest_at)) grp.latest_at = t.created_at;
            grp.records.push(t);
        }
        return Array.from(map.values());
    }, [transfers, activeTab]);

    // Totals for tab summary
    const totalQty = grouped.reduce((s, g) => s + g.total_quantity, 0);
    const totalGroups = grouped.length;

    if (loading) return <Loader text="Loading Transfer History..." />;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Transfer History" />

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                        <History size={24} className="text-primary" /> Transfer History
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Stock transferred out — grouped by product &amp; recipient.
                    </p>
                </div>

                {/* Summary pills */}
                {grouped.length > 0 && (
                    <div className="flex gap-3">
                        <div className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl px-4 py-2 text-center shadow-sm">
                            <div className="text-xl font-black text-primary">{totalGroups}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Products</div>
                        </div>
                        <div className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl px-4 py-2 text-center shadow-sm">
                            <div className="text-xl font-black text-green-600 dark:text-green-400">{totalQty}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Units</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6">
                <div className="flex gap-4 border-b border-stroke dark:border-strokedark flex-1">
                    {(["Delivery Officer", "Outlet"] as const).map(tab => (
                        <button
                            key={tab}
                            className={`pb-3 border-b-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
                                activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                            onClick={() => { setActiveTab(tab); setExpandedKeys(new Set()); setPage(1); }}
                        >
                            {tab === "Delivery Officer" ? <Truck size={16} /> : <Store size={16} />}
                            {tab === "Delivery Officer" ? "To Delivery Officers" : "To Other Outlets"}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:max-w-3xl">
                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg px-3 py-1.5 shadow-sm">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="bg-transparent text-xs outline-none dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg px-3 py-1.5 shadow-sm">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="bg-transparent text-xs outline-none dark:text-white"
                        />
                    </div>

                    <div className="relative flex-1 min-w-[200px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="fill-body hover:fill-primary dark:fill-bodydark dark:hover:fill-primary" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.7781 14.4938L12.0656 10.7812C12.7969 9.79687 13.2187 8.57812 13.2187 7.28437C13.2187 3.99375 10.5187 1.29375 7.22812 1.29375C3.9375 1.29375 1.2375 3.99375 1.2375 7.28437C1.2375 10.575 3.9375 13.275 7.22812 13.275C8.52187 13.275 9.74062 12.8531 10.725 12.1219L14.4375 15.8344C14.6344 16.0312 14.8875 16.1156 15.1125 16.1156C15.3375 16.1156 15.5906 16.0312 15.7781 15.8344C16.1719 15.4688 16.1719 14.8688 15.7781 14.4938ZM2.72812 7.28437C2.72812 4.78125 4.75312 2.75625 7.25625 2.75625C9.75938 2.75625 11.7844 4.78125 11.7844 7.28437C11.7844 9.7875 9.75938 11.8125 7.25625 11.8125C4.75312 11.8125 2.72812 9.7875 2.72812 7.28437Z" fill=""></path></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search product/IMEI..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full border border-stroke dark:border-strokedark rounded-lg pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-form-input focus:border-primary outline-none dark:text-white shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-boxdark rounded-xl shadow border border-stroke dark:border-strokedark overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
                            <tr className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                <th className="p-4 w-10" />
                                <th className="p-4 min-w-[220px]">Product</th>
                                <th className="p-4">Variant</th>
                                <th className="p-4 text-center">Total Units</th>
                                <th className="p-4">Recipient</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Last Transfer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-3 opacity-60">
                                            <Package size={44} />
                                            <span className="font-medium">No transfers to {activeTab}s yet.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : grouped.map(grp => {
                                const isExpanded = expandedKeys.has(grp.key);
                                return (
                                    <Fragment key={grp.key}>
                                        {/* GROUP ROW */}
                                        <tr
                                            key={`grp-${grp.key}`}
                                            onClick={() => toggleExpand(grp.key)}
                                            className={`border-b border-stroke dark:border-strokedark cursor-pointer transition-colors ${
                                                isExpanded
                                                ? "bg-primary/5 dark:bg-primary/10"
                                                : "hover:bg-gray-50 dark:hover:bg-meta-4/20"
                                            }`}
                                        >
                                            <td className="p-4 text-center">
                                                {isExpanded
                                                    ? <ChevronDown size={16} className="text-primary mx-auto" />
                                                    : <ChevronRight size={16} className="text-gray-400 mx-auto" />
                                                }
                                            </td>

                                            <td className="p-4">
                                                <div className="font-bold text-black dark:text-white">{grp.product_name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{grp.category || "—"}</div>
                                            </td>

                                            <td className="p-4">
                                                {grp.color_variant
                                                    ? <span className="px-2 py-0.5 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 rounded-full text-xs border border-violet-200 dark:border-violet-700">{grp.color_variant}</span>
                                                    : <span className="text-gray-400 text-xs">—</span>
                                                }
                                            </td>

                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-black text-lg">
                                                    {grp.total_quantity}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                                                    {activeTab === "Delivery Officer" ? <Truck size={13} /> : <Building2 size={13} />}
                                                    <span className="font-semibold text-xs">{grp.recipient_name}</span>
                                                </div>
                                            </td>

                                            <td className="p-4 text-center">
                                                {grp.records.some(r => r.status === 'pending') ? (
                                                    <span className="px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-100 dark:border-amber-800">Pending</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-green-100 dark:border-green-800">Delivered</span>
                                                )}
                                            </td>

                                            <td className="p-4 text-right text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                                                <div>{formatDate(grp.latest_at)}</div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">{grp.records.length} batch{grp.records.length !== 1 ? "es" : ""}</div>
                                            </td>
                                        </tr>

                                        {/* DETAIL ROWS */}
                                        {isExpanded && grp.records.map((rec, idx) => (
                                            <tr
                                                key={`rec-${rec.id}`}
                                                className="border-b border-dashed border-stroke/50 dark:border-strokedark/50 bg-gray-50/60 dark:bg-meta-4/10 text-xs"
                                            >
                                                {/* Index indent */}
                                                <td className="p-3 pl-8 text-center">
                                                    <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                                                </td>

                                                {/* IMEI / generic */}
                                                <td className="p-3 pl-10" colSpan={1}>
                                                    {rec.inventory.imei_serial
                                                        ? <span className="font-mono bg-gray-100 dark:bg-meta-4 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-strokedark text-gray-700 dark:text-gray-300">{rec.inventory.imei_serial}</span>
                                                        : <span className="text-gray-400 italic">Generic Batch</span>
                                                    }
                                                </td>

                                                {/* Variant */}
                                                <td className="p-3 text-gray-500">
                                                    {rec.inventory.color_variant || "—"}
                                                </td>

                                                {/* Qty transferred this batch */}
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                                                        {rec.quantity_transferred}x
                                                    </span>
                                                </td>

                                                {/* Price */}
                                                <td className="p-3 text-gray-600 dark:text-gray-300">
                                                    PKR {rec.inventory.purchase_price?.toLocaleString()}
                                                </td>

                                                {/* Detail Status */}
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        rec.status === 'delivered' 
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    }`}>
                                                        {rec.status}
                                                    </span>
                                                </td>

                                                {/* Date */}
                                                <td className="p-3 text-right text-gray-400 tabular-nums">
                                                    {formatDate(rec.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination & Summary */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-boxdark p-4 rounded-xl border border-stroke dark:border-strokedark">
                <div className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItemsCount)} of {totalItemsCount} Records
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 rounded-lg border border-stroke dark:border-strokedark text-sm font-bold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-meta-4 transition-all"
                    >
                        Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                page === i + 1 
                                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                : "border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4"
                            }`}
                        >
                            {i + 1}
                        </button>
                    )).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}
                    <button 
                        disabled={page >= totalPages || totalPages === 0}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 rounded-lg border border-stroke dark:border-strokedark text-sm font-bold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-meta-4 transition-all"
                    >
                        Next
                    </button>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500">
                    {grouped.length} groups · {transfers.length} records on this page
                </div>
            </div>
        </div>
    );
}
