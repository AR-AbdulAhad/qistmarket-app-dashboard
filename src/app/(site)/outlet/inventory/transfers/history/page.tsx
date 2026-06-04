"use client";

import { useState, useEffect, useMemo, Fragment, useRef } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
    History, Package, Truck, Store, ChevronDown, ChevronRight, Building2, X, KeyRound, CheckCircle2, RotateCcw
} from "lucide-react";
import Loader from "@/components/common/Loader";
import { toast } from "react-hot-toast";
import { useNotifications } from "../../../../../../../contexts/NotificationContext";
import { useAuth } from "../../../../../../../contexts/AuthContext";
import { formatExactDate } from "@/utils/dateUtils";

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
    updated_at: string;
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

    const [direction, setDirection] = useState<"sent" | "received">("sent");
    const [statusFilter, setStatusFilter] = useState<string>("");

    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
    const [otp, setOtp] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [itemToCancel, setItemToCancel] = useState<number | null>(null);

    // Stock Back Confirmation Modal
    const [backConfirmModalOpen, setBackConfirmModalOpen] = useState(false);
    const [backConfirmData, setBackConfirmData] = useState<{id: number, name: string, imei: string} | null>(null);

    const { socket } = useNotifications();
    const { user } = useAuth();

    const fetchHistory = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/api/outlet/inventory/transfers/history?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&direction=${direction}`;
            if (activeTab === "Delivery Officer" && direction === "sent") url += `&to_type=Delivery Officer`;
            if (activeTab === "Outlet") url += `&to_type=Outlet`;
            if (statusFilter) url += `&status=${statusFilter}`;
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

    const fetchHistoryRef = useRef(fetchHistory);
    useEffect(() => { fetchHistoryRef.current = fetchHistory; }, [fetchHistory]);

    useEffect(() => {
        fetchHistoryRef.current();
    }, [page, search, activeTab, startDate, endDate, direction, statusFilter]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleUpdate = () => {
            fetchHistoryRef.current();
        };

        socket.on("stock_transfer_initiated", handleUpdate);
        socket.on("stock_transfer_cancelled", handleUpdate);
        socket.on("stock_transfer_completed", (data: any) => {
            toast.success("Stock transfer confirmed!");
            handleUpdate();
        });
        socket.on("stock_transfer_status", (data: any) => {
            if (data.status === 'completed') {
                toast.success("Transfer completed successfully!");
            }
            handleUpdate();
        });

        // Stock Back events
        socket.on("stock_back_initiated", (data: any) => {
            toast.success("Stock back initiated!");
            handleUpdate();
        });
        socket.on("stock_back_completed", (data: any) => {
            toast.success("Stock back confirmed!");
            handleUpdate();
        });

        return () => {
            socket.off("stock_transfer_initiated", handleUpdate);
            socket.off("stock_transfer_cancelled", handleUpdate);
            socket.off("stock_transfer_completed");
            socket.off("stock_transfer_status");
            socket.off("stock_back_initiated", handleUpdate);
            socket.off("stock_back_completed", handleUpdate);
        };
    }, [socket, user]);

    const handleVerify = async () => {
        if (!selectedTransfer || otp.length < 4) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/inventory/transfer/verify`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ 
                    otp, 
                    inventory_ids: [{ id: selectedTransfer.inventory_id, quantity: selectedTransfer.quantity_transferred }],
                    to_id: selectedTransfer.to_id,
                    to_type: selectedTransfer.to_type
                }),
            });
            const data = await res.json();
            if (data.success) {
                setOtpModalOpen(false);
                setOtp("");
                // Refresh list
                toast.success("Verification successful!");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.error(data.message || "Verification failed.");
            }
        } catch {
            toast.error("Network error.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = (id: number) => {
        setItemToCancel(id);
        setConfirmModalOpen(true);
    };

    const executeCancel = async () => {
        if (!itemToCancel) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/inventory/transfer/cancel`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ transfer_ids: [itemToCancel], reason: "Cancelled by sender from history." }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Transfer cancelled successfully.");
                setConfirmModalOpen(false);
                setItemToCancel(null);
                fetchHistory();
            } else {
                toast.error(data.message || "Cancellation failed.");
            }
        } catch {
            toast.error("Network error.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleResendOTP = async (rec: TransferRecord) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/inventory/transfer/resend-otp`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ to_id: rec.to_id, to_type: rec.to_type, transfer_ids: [rec.id] }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("OTP resent successfully.");
                // For sender: Re-open the OTP entry modal so they can enter the new OTP
                if (direction === 'sent') {
                    setSelectedTransfer(rec);
                    setOtpModalOpen(true);
                    setOtp("");
                }
            } else {
                toast.error(data.message || "Failed to resend OTP.");
            }
        } catch {
            toast.error("Network error.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleInitiateStockBack = (id: number, name: string, imei: string) => {
        setBackConfirmData({ id, name, imei });
        setBackConfirmModalOpen(true);
    };

    const executeStockBack = async () => {
        if (!backConfirmData) return;
        
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/inventory/transfer/back/initiate`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ transfer_id: backConfirmData.id }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Stock back initiated! Please check for OTP popups.");
                setBackConfirmModalOpen(false);
                setBackConfirmData(null);
                fetchHistory();
            } else {
                toast.error(data.message || "Failed to initiate stock back.");
            }
        } catch {
            toast.error("Network error.");
        } finally {
            setActionLoading(false);
        }
    };

    const toggleExpand = (key: string) => {
        setExpandedKeys(prev => {
            const n = new Set(prev);
            n.has(key) ? n.delete(key) : n.add(key);
            return n;
        });
    };

    // Group by product+variant+recipient/sender
    const grouped = useMemo<GroupedTransfer[]>(() => {
        const map = new Map<string, GroupedTransfer>();

        for (const t of transfers) {
            const otherPartyId = direction === 'sent' ? t.to_id : t.from_id;
            const key = `${t.inventory.product_name}||${otherPartyId}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    product_name: t.inventory.product_name,
                    category: t.inventory.category,
                    color_variant: undefined,
                    to_type: t.to_type,
                    recipient_name: direction === 'sent' ? (t as any).recipient_name : (t as any).sender_name,
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
    }, [transfers, direction]);

    const totalQty = grouped.reduce((s, g) => s + g.total_quantity, 0);

    if (loading && transfers.length === 0) return <Loader text="Loading Transfer History..." />;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Transfer History" />

            {/* Tabs for Sent/Received */}
            <div className="flex gap-4 mb-8 border-b border-stroke dark:border-strokedark">
                <button
                    onClick={() => { setDirection("sent"); setPage(1); }}
                    className={`pb-4 px-6 text-sm font-bold transition-all border-b-2 ${direction === "sent" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                    Sent History
                </button>
                <button
                    onClick={() => { setDirection("received"); setPage(1); }}
                    className={`pb-4 px-6 text-sm font-bold transition-all border-b-2 ${direction === "received" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                    Received History
                </button>
            </div>

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                        <History size={24} className="text-primary" /> {direction === "sent" ? "Sent Transfers" : "Received Transfers"}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Stock {direction === "sent" ? "transferred out" : "transferred in"} — grouped by product & party.
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl px-4 py-2 text-center shadow-sm">
                        <div className="text-xl font-black text-primary">{totalItemsCount}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">Total Records</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6">
                <div className="flex gap-4 border-b border-stroke dark:border-strokedark flex-1">
                    {direction === "sent" ? (
                        (["Delivery Officer", "Outlet"] as const).map(tab => (
                            <button
                                key={tab}
                                className={`pb-3 border-b-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
                                    activeTab === tab
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                                onClick={() => { setActiveTab(tab); setPage(1); }}
                            >
                                {tab === "Delivery Officer" ? <Truck size={16} /> : <Store size={16} />}
                                {tab === "Delivery Officer" ? "To Delivery Officers" : "To Other Outlets"}
                            </button>
                        ))
                    ) : (
                        <div className="pb-3 border-b-2 border-primary text-primary text-sm font-semibold flex items-center gap-2">
                            <Store size={16} /> From Other Outlets
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:max-w-3xl">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="border border-stroke dark:border-strokedark rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-boxdark outline-none dark:text-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

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
                        <input
                            type="text"
                            placeholder="Search product/IMEI..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full border border-stroke dark:border-strokedark rounded-lg pl-4 pr-4 py-2 text-sm bg-gray-50 dark:bg-form-input focus:border-primary outline-none dark:text-white shadow-sm"
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
                                <th className="p-4 text-center">Units</th>
                                <th className="p-4">{direction === "sent" ? "Recipient" : "Sender"}</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-3 opacity-60">
                                            <Package size={44} />
                                            <span className="font-medium">No transfers found.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : grouped.map(grp => {
                                const isExpanded = expandedKeys.has(grp.key);
                                return (
                                    <Fragment key={grp.key}>
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
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </td>

                                            <td className="p-4">
                                                <div className="font-bold text-black dark:text-white">{grp.product_name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{grp.category || "—"}</div>
                                            </td>

                                            <td className="p-4">
                                                {grp.color_variant || "—"}
                                            </td>

                                            <td className="p-4 text-center font-bold">
                                                {grp.total_quantity}
                                            </td>

                                            <td className="p-4">
                                                <div className="font-semibold text-xs">{grp.recipient_name}</div>
                                            </td>

                                            <td className="p-4 text-center">
                                                {grp.records.some(r => r.status === 'pending') ? (
                                                    <span className="px-2 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-100 dark:border-amber-800">Pending</span>
                                                ) : grp.records.every(r => r.status === 'returned' || r.status === 'Stock Back') ? (
                                                    <span className="px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-green-100 dark:border-green-800">Stock Back</span>
                                                ) : grp.records.every(r => r.status === 'transferred' || r.status === 'delivered') ? (
                                                    <span className="px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-green-100 dark:border-green-800">Transferred</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-red-100 dark:border-red-800">Mixed/Cancelled</span>
                                                )}
                                            </td>

                                            <td className="p-4 text-right text-xs text-gray-500">
                                                {formatExactDate(grp.latest_at)}
                                            </td>
                                        </tr>

                                        {isExpanded && grp.records.map((rec) => (
                                            <tr key={rec.id} className="bg-gray-50/50 dark:bg-meta-4/5 text-xs">
                                                <td />
                                                <td className="p-3 pl-8 font-mono">{rec.inventory.imei_serial || "Generic"}</td>
                                                <td className="p-3">{rec.inventory.color_variant || "—"}</td>
                                                <td className="p-3 text-center">{rec.quantity_transferred}</td>
                                                <td className="p-3" />
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            (rec.status === 'transferred' || rec.status === 'delivered') ? "bg-green-100 text-green-700" : 
                                                            (rec.status === 'returned' || rec.status === 'Stock Back') ? "bg-green-100 text-green-800" :
                                                            rec.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                                        }`}>
                                                            {rec.status === 'returned' || rec.status === 'Stock Back' ? 'Stock Back' : rec.status === 'delivered' ? 'transferred' : rec.status}
                                                        </span>
                                                        {rec.status === 'Stock Back' && rec.updated_at && (
                                                            <span className="text-[10px] text-gray-400">
                                                                on {formatExactDate(rec.updated_at)}
                                                            </span>
                                                        )}
                                                        
                                                        {/* Actions for Pending */}
                                                        {rec.status === 'pending' && (
                                                            <div className="flex gap-1 ml-2">
                                                                {direction === 'sent' ? (
                                                                    <>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); setSelectedTransfer(rec); setOtpModalOpen(true); }}
                                                                            className="p-1.5 bg-primary text-white rounded hover:bg-opacity-90"
                                                                            title="Complete Transfer (Enter OTP)"
                                                                        >
                                                                            <CheckCircle2 size={12} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleResendOTP(rec); }}
                                                                            className="p-1.5 bg-blue-500 text-white rounded hover:bg-opacity-90"
                                                                            title="Resend OTP"
                                                                        >
                                                                            <KeyRound size={12} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleCancel(rec.id); }}
                                                                            className="p-1.5 bg-red-500 text-white rounded hover:bg-opacity-90"
                                                                            title="Cancel Transfer"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <div className="text-[10px] text-gray-400 italic">Awaiting your OTP...</div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* Actions for Transferred (Stock Back) */}
                                                        {(rec.status === 'transferred' || rec.status === 'delivered') && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleInitiateStockBack(rec.id, rec.inventory.product_name, rec.inventory.imei_serial || ""); }}
                                                                disabled={actionLoading}
                                                                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500 text-white rounded hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-sm"
                                                                title="Initiate Stock Back"
                                                            >
                                                                <RotateCcw size={14} />
                                                                <span className="text-[10px] font-bold">Stock Back</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right text-gray-400">
                                                    {formatExactDate(rec.created_at)}
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

            {/* Pagination ... */}
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
                                ? "bg-primary text-white" 
                                : "border border-stroke dark:border-strokedark hover:bg-gray-50"
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
            </div>

            {/* Verify Modal */}
            {otpModalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black bg-opacity-60 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-boxdark rounded-2xl p-8 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-4">Verify Receipt</h3>
                        <p className="text-sm text-gray-500 mb-6">Enter OTP provided by the sender to confirm receipt of stock.</p>
                        <input
                            type="text"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            placeholder="Enter OTP"
                            className="w-full border-2 border-stroke rounded-xl px-4 py-3 mb-6 outline-none focus:border-primary dark:bg-form-input dark:text-white"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setOtpModalOpen(false)} className="flex-1 py-3 border rounded-xl">Cancel</button>
                            <button onClick={handleVerify} disabled={actionLoading} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">
                                {actionLoading ? "Verifying..." : "Verify"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirmation Modal for Cancellation */}
            {confirmModalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-boxdark rounded-2xl p-8 max-w-sm w-full shadow-2xl">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-600">
                            <X size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-black dark:text-white mb-2">Cancel Transfer?</h3>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8 px-4">
                            Are you sure you want to cancel this pending transfer? This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => { setConfirmModalOpen(false); setItemToCancel(null); }}
                                className="flex-1 bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-opacity-80 transition-all"
                            >
                                No, Keep
                            </button>
                            <button
                                onClick={executeCancel}
                                disabled={actionLoading}
                                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20"
                            >
                                {actionLoading ? "Processing..." : "Yes, Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirmation Modal for Stock Back */}
            {backConfirmModalOpen && backConfirmData && (
                <div className="fixed inset-0 z-[9999] bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-boxdark rounded-2xl p-8 max-w-sm w-full shadow-2xl">
                        <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                            <RotateCcw size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-black dark:text-white mb-2">Initiate Stock Back?</h3>
                        <div className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8 px-4 space-y-2">
                            <p>Are you sure you want to reverse this transfer?</p>
                            <div className="p-3 bg-gray-50 dark:bg-meta-4 rounded-lg border border-stroke dark:border-strokedark mt-2">
                                <p className="font-bold text-black dark:text-white line-clamp-1">{backConfirmData.name}</p>
                                {backConfirmData.imei && <p className="text-[10px] text-primary font-mono mt-1">IMEI: {backConfirmData.imei}</p>}
                            </div>
                            <p className="text-[10px] font-bold text-amber-600 uppercase mt-4 text-center">Verification via OTP will be required</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => { setBackConfirmModalOpen(false); setBackConfirmData(null); }}
                                className="flex-1 bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-opacity-80 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeStockBack}
                                disabled={actionLoading}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
                            >
                                {actionLoading ? "Processing..." : "Initiate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
