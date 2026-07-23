"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import InstallmentsTable from "@/components/Installments/InstallmentsTable";
import InstallmentPaymentModal from "@/components/Installments/InstallmentPaymentModal";
import SmartPayQrModal from "@/components/Installments/SmartPayQrModal";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const getAuthHeaders = () => {
    const token = Cookies.get("auth_token");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

const pkr = (n: number) => `PKR ${Number(n || 0).toLocaleString()}`;

// ── Global Search Panel ──────────────────────────────────────────────────────
function GlobalInstallmentSearch({ onPay, onGenerateQR }: { onPay: (order: any, inst: any) => void, onGenerateQR: (order: any, inst: any) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const timerRef = useRef<any>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) { setResults([]); setShowPanel(false); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/outlet/installments?search=${encodeURIComponent(q)}&limit=8&page=1&globalSearch=true`,
                { headers: getAuthHeaders() }
            );
            const data = await res.json();
            if (data.success) {
                setResults(data.data.installments || []);
                setShowPanel(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(timerRef.current);
        if (query.trim().length >= 2) {
            timerRef.current = setTimeout(() => search(query), 350);
        } else {
            setResults([]);
            setShowPanel(false);
        }
        return () => clearTimeout(timerRef.current);
    }, [query, search]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setShowPanel(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={wrapRef} className="relative mb-8">
            {/* Search Banner */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-[28px] p-6 shadow-xl shadow-blue-200/40 dark:shadow-blue-900/30">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-3 text-white flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-widest opacity-80">Global Search</p>
                            <p className="text-[10px] opacity-60 font-medium">Any name · phone · ref · IMEI · 1Bill</p>
                        </div>
                    </div>
                    <div className="relative flex-1 w-full">
                        <input
                            type="text"
                            placeholder="Customer name, phone, order ref, IMEI or 1Bill ID…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onFocus={() => results.length > 0 && setShowPanel(true)}
                            className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-white/95 dark:bg-gray-900/80 text-gray-800 dark:text-white font-medium text-sm shadow-inner outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-400"
                        />
                        {loading ? (
                            <div className="absolute right-4 top-3.5">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : query ? (
                            <button onClick={() => { setQuery(""); setResults([]); setShowPanel(false); }} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Results Dropdown */}
            {showPanel && (
                <div className="absolute z-50 left-0 right-0 top-full mt-3 bg-white dark:bg-gray-800 rounded-[24px] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-[80vh] overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="font-semibold text-sm">No orders found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center sticky top-0 z-10">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
                                <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Close ✕</button>
                            </div>
                            {results.map(order => {
                                const { paidInstallments, totalInstallments, totalRemaining, totalArrears, grandTotalDue, grandTotalPaid, grandTotalRemaining, advanceAmount, advancePaid } = order.ledgerSummaries;
                                const progress = totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0;
                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                const hasTps = order.tpsPayments?.length > 0;

                                return (
                                    <div key={order.order_id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">

                                        {/* ─── Order Header ─── */}
                                        <div className="flex items-start justify-between mb-4 gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
                                                    {order.customer_name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-gray-800 dark:text-gray-100 text-base truncate">{order.customer_name}</p>
                                                    <p className="text-[11px] text-gray-500 font-medium">#{order.order_ref} · {order.whatsapp_number}</p>
                                                    <p className="text-[11px] text-gray-400 truncate">{order.product_name}{order.imei_serial ? ` · IMEI: ${order.imei_serial}` : ''}</p>
                                                    {order.outlet_name && order.outlet_name !== 'N/A' && (
                                                        <p className="text-[10px] text-indigo-500 font-bold">{order.outlet_name} ({order.outlet_code})</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-base font-black ${totalRemaining > 0 ? 'text-red-500' : 'text-green-500'}`}>{pkr(totalRemaining)}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{paidInstallments}/{totalInstallments} months paid</p>
                                                <div className="w-28 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1.5 ml-auto">
                                                    <div className={`h-1.5 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${progress}%` }} />
                                                </div>
                                                {(totalArrears || 0) > 0 && (
                                                    <p className="text-[10px] text-red-500 font-bold mt-1">⚠ Arrears: {pkr(totalArrears)}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* ─── People + 1Bill Info ─── */}
                                        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            {order.purchaser?.name && (
                                                <div className="flex items-center gap-2">
                                                    {order.purchaser.profile_photo ? (
                                                        <img src={order.purchaser.profile_photo.startsWith('http') ? order.purchaser.profile_photo : `${API_BASE.replace(/\/$/, '')}/${order.purchaser.profile_photo.replace(/^\//, '')}`} alt="Purchaser" className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-600 flex-shrink-0">P</div>
                                                    )}
                                                    <div className="text-[10px]">
                                                        <p className="font-bold text-gray-700 dark:text-gray-300">{order.purchaser.name}</p>
                                                        <p className="text-gray-500">Purchaser · CNIC: {order.purchaser.cnic_number || '—'}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {order.grantors?.map((g: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    {g.profile_photo ? (
                                                        <img src={g.profile_photo.startsWith('http') ? g.profile_photo : `${API_BASE.replace(/\/$/, '')}/${g.profile_photo.replace(/^\//, '')}`} alt={`Grantor ${i + 1}`} className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-black text-orange-600 flex-shrink-0">G{i + 1}</div>
                                                    )}
                                                    <div className="text-[10px]">
                                                        <p className="font-bold text-gray-700 dark:text-gray-300">{g.name}</p>
                                                        <p className="text-gray-500">Grantor {i + 1}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="ml-auto flex flex-col justify-center text-[10px] text-right">
                                                <p className="text-gray-500"><span className="font-bold">Date:</span> {new Date(order.created_at).toLocaleDateString('en-PK')}</p>
                                                {order.consumer_number && (
                                                    <p className="text-blue-600 font-bold mt-0.5">1Bill: {order.consumer_number}
                                                    </p>
                                                )}
                                                {order.smartpay_consumer_number && (
                                                    <p className="text-emerald-600 font-bold mt-0.5">SmartPay: {order.smartpay_consumer_number}
                                                    </p>
                                                )}
                                                {order.recovery_officer && (
                                                    <p className="text-gray-500 mt-0.5"><span className="font-bold">RO:</span> {order.recovery_officer.name}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* ─── Financial Summary Bar ─── */}
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5 text-center">
                                                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Total Due</p>
                                                <p className="text-sm font-black text-blue-700 dark:text-blue-300">{pkr(grandTotalDue || 0)}</p>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5 text-center">
                                                <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Total Paid</p>
                                                <p className="text-sm font-black text-green-700 dark:text-green-300">{pkr(grandTotalPaid || 0)}</p>
                                            </div>
                                            <div className={`${(grandTotalRemaining || 0) > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/30'} rounded-xl p-2.5 text-center`}>
                                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Remaining</p>
                                                <p className={`text-sm font-black ${(grandTotalRemaining || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{pkr(grandTotalRemaining || 0)}</p>
                                            </div>
                                        </div>

                                        {/* ─── Installment Ledger Table ─── */}
                                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-4">
                                            {/* Advance Row */}
                                            {(advanceAmount || 0) > 0 && (
                                                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-7 text-center">ADV</span>
                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Advance Payment</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{pkr(advanceAmount)}</span>
                                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${advancePaid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700'}`}>
                                                            {advancePaid ? '✓ PAID' : 'PENDING'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Monthly Installment Rows */}
                                            {order.installmentLedger?.map((inst: any, idx: number) => {
                                                const isPaid = inst.status === 'paid' || inst.status === 'Paid';
                                                const isPartial = inst.status === 'partial';
                                                const instDueDate = inst.dueDate ? new Date(inst.dueDate) : null;
                                                instDueDate?.setHours(0, 0, 0, 0);
                                                const isOverdue = !isPaid && instDueDate && instDueDate < today;
                                                const hasArrears = (inst.arrears || 0) > 0;

                                                return (
                                                    <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors ${isPaid ? 'bg-green-50/30' : isPartial ? 'bg-blue-50/40' : isOverdue ? 'bg-red-50/60 dark:bg-red-900/10' : ''}`}>
                                                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                                                            <span className={`text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${isPaid ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : isPartial ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' : isOverdue ? 'text-red-600 bg-red-100 dark:bg-red-900/30' : 'text-gray-500 bg-gray-100 dark:bg-gray-700'}`}>
                                                                M{inst.monthNumber}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-sm font-extrabold text-gray-800 dark:text-gray-100">{pkr(inst.dueAmount)}</span>
                                                                    {hasArrears && (
                                                                        <span className="text-[9px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">+{pkr(inst.arrears)} arr.</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col gap-1 mt-1">
                                                                    <span className="text-[9px] text-gray-400">Due: {instDueDate ? instDueDate.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</span>
                                                                    {inst.payment_history && inst.payment_history.length > 0 ? (
                                                                        <div className="flex flex-col gap-1 mt-0.5 border-l-2 border-emerald-100 pl-2">
                                                                            {inst.payment_history.map((ph: any, phi: number) => (
                                                                                <div key={phi} className="flex items-center gap-1.5 flex-wrap">
                                                                                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm">PAID: {pkr(ph.amount)}</span>
                                                                                    <span className="text-[9px] text-gray-400">on {new Date(ph.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                                                                    <span className="text-[8px] font-semibold text-indigo-500 truncate max-w-[120px]" title={ph.method}>via {ph.method}</span>
                                                                                </div>
                                                                            ))}
                                                                            {isPartial && (
                                                                                <div className="mt-1">
                                                                                    <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded shadow-sm">REM: {pkr(inst.remainingAmount ?? (inst.dueAmount - (inst.paidAmount || 0)))}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col gap-1">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                {inst.paymentMethod && (
                                                                                    <span className="text-[9px] text-indigo-500 font-semibold truncate max-w-[120px]">{inst.paymentMethod}</span>
                                                                                )}
                                                                                {inst.paidAt && (
                                                                                    <span className="text-[9px] text-emerald-600 font-semibold">· Paid {new Date(inst.paidAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</span>
                                                                                )}
                                                                            </div>
                                                                            {isPartial && (
                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">PAID: {pkr(inst.paidAmount)}</span>
                                                                                    <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">REM: {pkr(inst.remainingAmount ?? (inst.dueAmount - (inst.paidAmount || 0)))}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                                                            <span className={`text-[9px] px-2 py-1 rounded-md font-black ${
                                                                isPaid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : isPartial ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                                                                : isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
                                                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'
                                                            }`}>
                                                                {isPaid ? '✓ PAID' : isPartial ? 'PARTIAL' : isOverdue ? 'OVERDUE' : 'PENDING'}
                                                            </span>
                                                            {!isPaid && (
                                                                <>
                                                                    <button
                                                                        onClick={() => { onPay(order, inst); setShowPanel(false); }}
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-colors"
                                                                    >
                                                                        {isPartial ? 'PAY REST' : 'PAY'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { onGenerateQR(order, inst); setShowPanel(false); }}
                                                                        className="text-gray-500 hover:text-[#2b6cb0] hover:bg-blue-50 dark:hover:bg-gray-700 p-1.5 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                                        title="Generate SmartPay QR"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                                        </svg>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        

                                        {/* ─── Quick Pay Next Due Button ─── */}
                                        {(() => {
                                            const nextPending = order.installmentLedger?.find((r: any) => r.status !== 'paid' && r.status !== 'Paid');
                                            return nextPending ? (
                                                <button
                                                    onClick={() => { onPay(order, nextPending); setShowPanel(false); }}
                                                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-90 transition-opacity"
                                                >
                                                    Collect Next Due · {pkr(nextPending.remainingAmount ?? nextPending.dueAmount)}
                                                    {(nextPending.arrears || 0) > 0 && ` (incl. ${pkr(nextPending.arrears)} arrears)`}
                                                </button>
                                            ) : null;
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function InstallmentsContent() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") || "";

    const [data, setData] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialSearch);
    const [activeTab, setActiveTab] = useState<'fresh' | 'overdue' | 'paid'>('fresh');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [stats, setStats] = useState<{ totalAmount: number; customerCount: number; summaries?: any }>({ totalAmount: 0, customerCount: 0 });

    // Selection state for export
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

    // QR Modal state
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrOrderId, setQrOrderId] = useState<number | null>(null);
    const [qrMonthNumber, setQrMonthNumber] = useState<number | null>(null);
    const [qrDefaultAmount, setQrDefaultAmount] = useState<number | null>(null);
    const [qrCustomerName, setQrCustomerName] = useState("");

    // Sync search from URL if it changes
    useEffect(() => {
        if (initialSearch) setSearch(initialSearch);
    }, [initialSearch]);

    useEffect(() => {
        fetchInstallments();
    }, [pagination.page, search, activeTab, startDate, endDate]);

    const fetchInstallments = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: pagination.page.toString(),
                search,
                tab: activeTab,
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            }).toString();

            const res = await fetch(`${API_BASE}/api/outlet/installments?${query}`, {
                headers: getAuthHeaders(),
            });
            const result = await res.json();
            if (result.success) {
                setData(result.data.installments);
                setPagination(result.data.pagination);
                setStats({
                    totalAmount: result.data.totalAmount || 0,
                    customerCount: result.data.customerCount || 0,
                    summaries: result.data.summaries || null
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePayClick = (order: any, installment: any) => {
        setSelectedOrder(order);
        setSelectedInstallment(installment);
        setModalOpen(true);
    };

    const handleGenerateQR = (order: any, installment: any) => {
        setQrOrderId(order.order_id);
        setQrMonthNumber(installment.monthNumber);
        setQrDefaultAmount(installment.remainingAmount ?? (installment.dueAmount - (installment.paidAmount || 0)));
        setQrCustomerName(order.customer_name);
        setQrModalOpen(true);
    };

    const toggleRowSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const exportToCSV = () => {
        const rowsToExport = selectedIds.length > 0
            ? data.filter(item => selectedIds.includes(item.order_id))
            : data;

        if (rowsToExport.length === 0) return;

        // Determine max months across all exported ledgers to create dynamic columns
        let maxMonths = 0;
        rowsToExport.forEach(item => {
            if (item.installmentLedger && item.installmentLedger.length > maxMonths) {
                maxMonths = item.installmentLedger.length;
            }
        });

        // Base Headers
        const headers = [
            "Order Ref", "Status", "Customer Name", "Customer CNIC", "Customer Phone",
            "Product", "IMEI", "Total Due", "Total Paid", "Remaining Balance",
            "Grantor 1 Name", "Grantor 1 CNIC", "Grantor 1 Phone",
            "Grantor 2 Name", "Grantor 2 CNIC", "Grantor 2 Phone"
        ];

        // Dynamic Ledger Headers
        for (let i = 1; i <= maxMonths; i++) {
            headers.push(`Month ${i} Amount`, `Month ${i} Status`, `Month ${i} Paid Date`);
        }

        const csvRows = [headers.join(",")];

        rowsToExport.forEach(item => {
            const p = item.purchaser || {};
            const g1 = item.grantors?.[0] || {};
            const g2 = item.grantors?.[1] || {};

            const safeString = (str: any) => `"${(str || '').toString().replace(/"/g, '""')}"`;

            const rowData = [
                safeString(item.order_ref),
                safeString(item.status),
                safeString(item.customer_name),
                safeString(p.cnic_number),
                safeString(item.whatsapp_number),
                safeString(item.product_name),
                safeString(item.imei_serial),
                item.ledgerSummaries.totalInstallmentDue || 0,
                item.ledgerSummaries.totalInstallmentPaid || 0,
                item.ledgerSummaries.totalRemaining || 0,
                safeString(g1.name), safeString(g1.cnic_number), safeString(g1.phone_number),
                safeString(g2.name), safeString(g2.cnic_number), safeString(g2.phone_number)
            ];

            // Append ledger details for each month
            for (let i = 0; i < maxMonths; i++) {
                const ledgerRow = item.installmentLedger[i];
                if (ledgerRow) {
                    rowData.push(
                        ledgerRow.dueAmount || 0,
                        safeString(ledgerRow.status || 'pending'),
                        safeString(ledgerRow.paidAt ? new Date(ledgerRow.paidAt).toISOString().split('T')[0] : 'N/A')
                    );
                } else {
                    rowData.push('""', '""', '""'); // empty cells if ledger doesn't go this high
                }
            }

            csvRows.push(rowData.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `installments_export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            <GlobalInstallmentSearch onPay={handlePayClick} onGenerateQR={handleGenerateQR} />

            {/* Header & Stats */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Installments Summary</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Tracking {activeTab} installments and collections.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {stats.summaries && (
                        <>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center px-6 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fresh Accounts</p>
                                </div>
                                <p className="text-lg font-black text-gray-900 dark:text-white">PKR {stats.summaries.fresh.amount.toLocaleString()}</p>
                                <p className="text-xs font-bold text-gray-500 mt-0.5">{stats.summaries.fresh.count} Customers</p>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center px-6 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overdue Accounts</p>
                                </div>
                                <p className="text-lg font-black text-gray-900 dark:text-white">PKR {stats.summaries.overdue.amount.toLocaleString()}</p>
                                <p className="text-xs font-bold text-gray-500 mt-0.5">{stats.summaries.overdue.count} Customers</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center px-6 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paid Accounts</p>
                                </div>
                                <p className="text-lg font-black text-gray-900 dark:text-white">PKR {stats.summaries.paid.amount.toLocaleString()}</p>
                                <p className="text-xs font-bold text-gray-500 mt-0.5">{stats.summaries.paid.count} Customers</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row items-center gap-4">
                {/* Tabs */}
                <div className="flex p-1 bg-gray-50 dark:bg-gray-900 rounded-2xl w-full md:w-auto overflow-x-auto">
                    <button
                        onClick={() => { setActiveTab('fresh'); setPagination({ ...pagination, page: 1 }); }}
                        className={`flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'fresh' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Fresh
                    </button>
                    <button
                        onClick={() => { setActiveTab('overdue'); setPagination({ ...pagination, page: 1 }); }}
                        className={`flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'overdue' ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Overdue
                    </button>
                    <button
                        onClick={() => { setActiveTab('paid'); setPagination({ ...pagination, page: 1 }); }}
                        className={`flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'paid' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Paid
                    </button>
                </div>

                <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-700 hidden md:block"></div>

                {/* Search */}
                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Search customer, ref or IMEI..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-transparent border-none focus:ring-0 outline-none text-sm font-medium dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-700 hidden md:block"></div>

                {/* Date Filters */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="date"
                        className="bg-gray-50 dark:bg-gray-900 px-4 py-2.5 rounded-xl text-xs font-bold border-none outline-none focus:ring-1 focus:ring-blue-500"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-gray-400 text-xs font-bold">to</span>
                    <input
                        type="date"
                        className="bg-gray-50 dark:bg-gray-900 px-4 py-2.5 rounded-xl text-xs font-bold border-none outline-none focus:ring-1 focus:ring-blue-500"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-700 hidden md:block"></div>

                {/* Export */}
                <button
                    onClick={exportToCSV}
                    className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export All'}
                </button>
            </div>

            {loading && data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Fetching Ledgers...</p>
                </div>
            ) : (
                <>
                    <InstallmentsTable
                        data={data}
                        onPay={handlePayClick}
                        selectedIds={selectedIds}
                        onSelectRow={toggleRowSelection}
                    />

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-10">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm disabled:opacity-30 hover:border-blue-500 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                            </button>
                            <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <span className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                    Page {pagination.page} <span className="text-gray-300 mx-2">/</span> {pagination.totalPages}
                                </span>
                            </div>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={pagination.page === pagination.totalPages}
                                className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm disabled:opacity-30 hover:border-blue-500 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                        </div>
                    )}
                </>
            )}

            <InstallmentPaymentModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchInstallments}
                orderId={selectedOrder?.order_id}
                orderRef={selectedOrder?.order_ref}
                customerName={selectedOrder?.customer_name}
                installment={selectedInstallment}
            />

            <SmartPayQrModal 
                open={qrModalOpen} 
                onClose={() => setQrModalOpen(false)} 
                orderId={qrOrderId} 
                monthNumber={qrMonthNumber} 
                defaultAmount={qrDefaultAmount}
                customerName={qrCustomerName}
            />
        </div>
    );
}

export default function OutletInstallmentsPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
            <InstallmentsContent />
        </Suspense>
    );
}
