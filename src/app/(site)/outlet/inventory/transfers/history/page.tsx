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

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/outlet/inventory/transfers/history`, { headers: getAuthHeaders() });
                const json = await res.json();
                if (json.success) setTransfers(json.transfers);
            } catch {
                console.error("Failed to load transfer history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const toggleExpand = (key: string) => {
        setExpandedKeys(prev => {
            const n = new Set(prev);
            n.has(key) ? n.delete(key) : n.add(key);
            return n;
        });
    };

    // Filter by tab + group by product+variant+recipient
    const grouped = useMemo<GroupedTransfer[]>(() => {
        const filtered = transfers.filter(t => t.to_type === activeTab);
        const map = new Map<string, GroupedTransfer>();

        for (const t of filtered) {
            const key = `${t.inventory.product_name}||${t.inventory.color_variant || ""}||${t.to_id}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    product_name: t.inventory.product_name,
                    category: t.inventory.category,
                    color_variant: t.inventory.color_variant,
                    to_type: t.to_type,
                    recipient_name: t.recipient_name,
                    total_quantity: 0,
                    latest_at: t.created_at,
                    records: [],
                });
            }
            const grp = map.get(key)!;
            grp.total_quantity += t.quantity_transferred || 1;
            // Keep latest date
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

            {/* Tabs */}
            <div className="flex gap-4 border-b border-stroke dark:border-strokedark mb-6">
                {(["Delivery Officer", "Outlet"] as const).map(tab => (
                    <button
                        key={tab}
                        className={`pb-3 border-b-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
                            activeTab === tab
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                        onClick={() => { setActiveTab(tab); setExpandedKeys(new Set()); }}
                    >
                        {tab === "Delivery Officer" ? <Truck size={16} /> : <Store size={16} />}
                        {tab === "Delivery Officer" ? "To Delivery Officers" : "To Other Outlets"}
                    </button>
                ))}
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
                                    <td colSpan={6} className="p-16 text-center text-gray-500 dark:text-gray-400">
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

            <div className="mt-4 text-xs text-center text-gray-400 dark:text-gray-500">
                {grouped.length} product group{grouped.length !== 1 ? "s" : ""} · {transfers.filter(t => t.to_type === activeTab).length} total transfer records
            </div>
        </div>
    );
}
