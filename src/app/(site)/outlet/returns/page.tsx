"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { PackageX, ArchiveRestore, Clock, ArrowRightLeft, Search, RefreshCw, Plus, User, Info, DollarSign, Tag, CheckCircle2, History } from "lucide-react";
import Loader from "@/components/common/Loader";
import ReturnVerificationPopup from "@/components/ReturnVerificationPopup";
import { Modal } from "@/components/Modal/Modal";
import { toast } from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function ReturnExchangesPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifyingRecord, setVerifyingRecord] = useState<any | null>(null);
    const [search, setSearch] = useState("");
    
    // Direct Return Modal States
    const [showDirectModal, setShowDirectModal] = useState(false);
    const [orderQuery, setOrderQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchingOrders, setSearchingOrders] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [directType, setDirectType] = useState<"Return" | "Exchange">("Return");
    const [isCashRefund, setIsCashRefund] = useState(false);
    const [refundAmount, setRefundAmount] = useState("");
    const [submittingDirect, setSubmittingDirect] = useState(false);

    const token = useMemo(() => Cookies.get('auth_token'), []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/return-exchanges`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setRecords(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
        
        const handleRefresh = () => fetchRecords();
        window.addEventListener('refreshReturnList', handleRefresh);
        return () => window.removeEventListener('refreshReturnList', handleRefresh);
    }, []);

    // Search delivered orders for direct return
    const searchOrders = useCallback(async (q: string) => {
        if (q.length < 3) {
            setSearchResults([]);
            return;
        }
        setSearchingOrders(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/search-delivered-orders?query=${q}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSearchResults(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSearchingOrders(false);
        }
    }, [token]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (orderQuery) searchOrders(orderQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [orderQuery, searchOrders]);

    const handleDirectSubmit = async () => {
        if (!selectedOrder) return;
        setSubmittingDirect(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/initiate-direct-return`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    order_id: selectedOrder.id,
                    type: directType,
                    is_cash_refund: isCashRefund,
                    refund_amount: parseFloat(refundAmount) || 0
                }),
            });
            const result = await res.json();
            if (result.success) {
                toast.success(result.message || "OTP Sent to Customer");
                
                // Immediately open verification popup for this new record
                setVerifyingRecord({
                    id: result.data.record_id,
                    order: {
                        order_ref: selectedOrder.order_ref,
                        customer_name: selectedOrder.customer_name
                    },
                    delivery_officer: { full_name: "Outlet" } // Identifier for direct return
                });

                setShowDirectModal(false);
                setSelectedOrder(null);
                setOrderQuery("");
                setIsCashRefund(false);
                setRefundAmount("");
                fetchRecords();
            } else {
                toast.error(result.error || "Failed to process");
            }
        } catch (error) {
            console.error(error);
            toast.error("Internal server error");
        } finally {
            setSubmittingDirect(false);
        }
    };

    const filteredRecords = records.filter(r => 
        r.order?.order_ref?.toLowerCase().includes(search.toLowerCase()) ||
        r.order?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.order?.product_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.delivery_officer?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const pendingRecords = filteredRecords.filter(r => r.status === 'pending');
    const completedRecords = filteredRecords.filter(r => r.status === 'verified');

    if (loading && records.length === 0) return <Loader text="Loading Returns & Exchanges..." />;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Returns & Exchanges" />

            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ArrowRightLeft className="text-primary" /> Return & Exchange Management
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Manage stock returns from delivery officers or walk-in customers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                           <Search size={16} />
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search records..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-stroke dark:border-strokedark bg-white dark:bg-boxdark rounded-xl text-sm outline-none focus:border-primary transition-all w-64 shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => setShowDirectModal(true)}
                        className="bg-primary hover:bg-opacity-90 text-white px-4 py-2 rounded-xl text-sm font-black uppercase tracking-tight flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={16} /> Direct Return
                    </button>
                    <button 
                        onClick={fetchRecords}
                        className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Records</p>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">{records.length}</p>
                </div>
                <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-sm border-l-4 border-l-warning">
                    <p className="text-[10px] font-black uppercase tracking-widest text-warning mb-1">Pending Actions</p>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">{pendingRecords.length}</p>
                </div>
                <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-sm border-l-4 border-l-success">
                    <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1">Total Verified</p>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">{completedRecords.length}</p>
                </div>
                <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-sm border-l-4 border-l-primary">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Exchanges</p>
                    <p className="text-2xl font-black text-gray-800 dark:text-white">{records.filter(r => r.type === 'Exchange').length}</p>
                </div>
            </div>

            {/* Pending Actions */}
            <div className="mb-10">
                <h2 className="text-sm font-black uppercase tracking-widest text-warning flex items-center gap-2 mb-4 ml-1">
                    <Clock size={16} /> Pending Drop-offs ({pendingRecords.length})
                </h2>
                {pendingRecords.length === 0 ? (
                    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-10 text-center text-gray-400">
                        <PackageX size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-bold text-sm uppercase tracking-widest">{search ? "No matching records" : "No pending drop-offs"}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingRecords.map(r => (
                            <div key={r.id} className="bg-white dark:bg-boxdark rounded-2xl p-5 border border-warning/30 border-l-4 border-l-warning shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                        r.type === 'Exchange' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                        {r.type} Request
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-meta-4 px-2 py-1 rounded italic">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight flex items-center gap-2">
                                        <User size={16} className="text-gray-400" /> {r.order?.customer_name || 'N/A'}
                                    </h3>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">
                                        Ref: <span className="underline italic tracking-tighter">#{r.order?.order_ref || r.order_id}</span>
                                    </p>
                                </div>
                                
                                {r.is_cash_refund && (
                                    <div className="mb-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                                                <DollarSign size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Cash Refund Ready</p>
                                                <p className="text-sm font-black text-red-700 dark:text-red-400">Rs. {r.refund_amount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-200 dark:border-red-800 text-[8px] font-black text-red-600 uppercase tracking-tighter">
                                            Advance Refund
                                        </div>
                                    </div>
                                )}

                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-5 space-y-2">
                                    <div className="bg-gray-50 dark:bg-meta-4/20 p-3 rounded-xl border border-stroke dark:border-strokedark">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Product</p>
                                            <Tag size={10} className="text-gray-400" />
                                        </div>
                                        <p className="font-bold text-gray-700 dark:text-gray-200 text-xs leading-none mb-1">{r.product_name || r.order?.product_name || 'N/A'}</p>
                                        {r.imei_returned && (
                                            <p className="text-[9px] font-mono text-primary/70 bg-primary/5 px-2 py-0.5 rounded inline-block">
                                                IMEI: {r.imei_returned}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 px-1">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center text-gray-400">
                                           <Clock size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Drop-off By</p>
                                            <p className="font-bold text-gray-700 dark:text-gray-200 text-xs">{r.delivery_officer?.full_name}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setVerifyingRecord(r)}
                                    className="w-full py-4 bg-warning hover:bg-opacity-90 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-warning/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={14} /> Verify OTP & Receive
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History Table */}
            <div>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-sm font-black uppercase tracking-widest text-success flex items-center gap-2">
                        <ArchiveRestore size={16} /> Completed Restocks ({completedRecords.length})
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-success"></div> Ready Stock
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-primary"></div> Used Stock
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden mb-20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
                                <tr className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="px-5 py-4">Ref/Order</th>
                                    <th className="px-5 py-4">Customer</th>
                                    <th className="px-5 py-4">Product</th>
                                    <th className="px-5 py-4 text-center">Type</th>
                                    <th className="px-5 py-4">Financials</th>
                                    <th className="px-5 py-4">Officer/Direct</th>
                                    <th className="px-5 py-4">Status & Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stroke dark:divide-strokedark">
                                {completedRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-20 text-gray-400 font-medium">
                                            <History size={48} className="mx-auto mb-4 opacity-10" />
                                            <p className="uppercase tracking-widest text-xs font-black">No restock history available.</p>
                                        </td>
                                    </tr>
                                ) : completedRecords.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-all group">
                                        <td className="px-5 py-4">
                                            <p className="font-black text-gray-800 dark:text-white leading-none mb-1 group-hover:text-primary transition-colors">#{r.order?.order_ref}</p>
                                            <div className="flex items-center gap-1">
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                                    r.is_used ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-success/10 text-success border border-success/20'
                                                }`}>
                                                    {r.is_used ? 'Used Stock' : 'Ready Stock'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-gray-600 dark:text-gray-300">
                                            {r.order?.customer_name || 'N/A'}
                                            <p className="text-[10px] font-medium text-gray-400 truncate max-w-[120px]">{r.order?.phone}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-gray-800 dark:text-white font-black text-xs truncate max-w-[180px]">{r.product_name || r.order?.product_name}</p>
                                            <p className="text-[9px] text-primary/60 font-mono tracking-tighter italic">{r.imei_returned || 'No IMEI'}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${
                                                r.type === 'Exchange' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {r.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {r.is_cash_refund ? (
                                                <div>
                                                    <p className="text-[10px] font-black text-red-500 leading-none mb-1">CASH REFUND</p>
                                                    <p className="font-black text-gray-800 dark:text-white">Rs. {r.refund_amount?.toLocaleString()}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">No Refund</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                                            {r.initiated_by === 'Outlet' ? (
                                                <div className="flex items-center gap-2 text-primary">
                                                    <CheckCircle2 size={14} />
                                                    <p className="font-black text-[10px] uppercase tracking-widest">Direct Return</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="font-bold text-xs">{r.delivery_officer?.full_name}</p>
                                                    <p className="text-[9px] text-gray-400 tracking-tighter">{r.delivery_officer?.phone}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                                                <p className="text-xs font-black text-gray-700 dark:text-gray-200">
                                                    {r.verified_at ? new Date(r.verified_at).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }) : ''}
                                                </p>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 pl-3.5 mt-0.5">
                                                {r.verified_at ? new Date(r.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Direct Return Modal */}
            <Modal open={showDirectModal} onClose={() => setShowDirectModal(false)}>
                <div className="bg-white dark:bg-boxdark rounded-3xl p-8 max-w-2xl w-full mx-auto shadow-2xl border border-stroke dark:border-strokedark overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                                <Plus className="text-primary" /> Direct Sales Return
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">Process returns for walk-in customers instantly.</p>
                        </div>
                        <button 
                            onClick={() => setShowDirectModal(false)}
                            className="bg-gray-100 dark:bg-meta-4 text-gray-500 p-2 rounded-full hover:bg-gray-200 transition-all"
                        >
                            <PackageX size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Search Order */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 items-center flex gap-2">
                                <Search size={12} /> 1. Search Delivered Order
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Enter Order Reference or Customer Name" 
                                    value={orderQuery}
                                    onChange={(e) => setOrderQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-stroke dark:border-strokedark rounded-2xl focus:border-primary outline-none font-bold text-gray-800 dark:text-white transition-all shadow-inner"
                                />
                                {searchingOrders && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && !selectedOrder && (
                                <div className="mt-2 bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                    {searchResults.map((order: any) => (
                                        <button
                                            key={order.id}
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setSearchResults([]);
                                                setOrderQuery(order.order_ref);
                                                setRefundAmount(order.delivered_advance?.toString() || "");
                                            }}
                                            className="w-full px-5 py-4 text-left hover:bg-primary/5 border-b border-stroke dark:border-strokedark last:border-none transition-colors flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="font-black text-gray-800 dark:text-white group-hover:text-primary transition-colors">#{order.order_ref}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                    {order.customer_name} • {order.delivered_product_name} • IMEI: {order.delivered_imei}
                                                </p>
                                            </div>
                                            <ArrowRightLeft size={16} className="text-gray-300 group-hover:text-primary" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedOrder && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-stroke dark:border-strokedark">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Action Type</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setDirectType("Return")} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${directType === 'Return' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-400'}`}>Return</button>
                                            <button onClick={() => setDirectType("Exchange")} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${directType === 'Exchange' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-400'}`}>Exchange</button>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-stroke dark:border-strokedark">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Include Refund?</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsCashRefund(false)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${!isCashRefund ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-400'}`}>No Cash</button>
                                            <button onClick={() => setIsCashRefund(true)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${isCashRefund ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-400'}`}>With Cash</button>
                                        </div>
                                    </div>
                                </div>

                                {isCashRefund && (
                                    <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 p-6 rounded-3xl animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                                                    <DollarSign size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight">Refund Details</h3>
                                                    <p className="text-[10px] text-red-500 font-bold uppercase">Impacts Daily Book</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase">Paid During Delivery</p>
                                                <p className="text-lg font-black text-gray-800 dark:text-white">Rs. {selectedOrder.delivered_advance?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">Rs.</span>
                                            <input type="number" placeholder="Refund Amount" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-800 rounded-2xl focus:border-red-500 outline-none font-black text-2xl text-red-600 transition-all shadow-inner" />
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-100 dark:bg-meta-4/20 p-5 rounded-2xl border-2 border-dashed border-stroke dark:border-strokedark flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-boxdark rounded-xl flex items-center justify-center text-primary shadow-sm">
                                        <ArrowRightLeft size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivered Product Details</p>
                                        <p className="font-black text-gray-800 dark:text-white text-sm leading-none">{selectedOrder.customer_name}</p>
                                        <p className="text-[10px] text-gray-500 font-bold mt-1 tracking-tight">
                                            {selectedOrder.delivered_product_name} 
                                            {(selectedOrder.delivered_color && selectedOrder.delivered_color !== 'N/A') ? ` (${selectedOrder.delivered_color}${selectedOrder.delivered_variant && selectedOrder.delivered_variant !== 'N/A' ? ` - ${selectedOrder.delivered_variant}` : ''})` : ''} 
                                            • IMEI: {selectedOrder.delivered_imei}
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedOrder(null)} className="text-xs font-black text-gray-400 hover:text-red-500 transition-colors uppercase">Change</button>
                                </div>

                                <button 
                                    onClick={handleDirectSubmit}
                                    disabled={submittingDirect || (isCashRefund && !refundAmount)}
                                    className="w-full py-5 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    {submittingDirect ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={18} /> <span>Process {directType} Now</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {verifyingRecord && (
                <ReturnVerificationPopup 
                    isOpen={!!verifyingRecord}
                    onClose={() => setVerifyingRecord(null)}
                    recordId={verifyingRecord.id}
                    orderRef={verifyingRecord.order?.order_ref || 'Unknown'}
                    officerName={verifyingRecord.delivery_officer?.full_name || 'Officer'}
                    productName={verifyingRecord.product_name || verifyingRecord.order?.product_name}
                    color={verifyingRecord.product_color}
                    variant={verifyingRecord.product_variant}
                    advance={verifyingRecord.delivered_advance_amount}
                    onSuccess={() => {
                        fetchRecords();
                    }}
                />
            )}
        </div>
    );
}
