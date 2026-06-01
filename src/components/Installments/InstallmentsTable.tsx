"use client";

import React, { useState } from "react";
import SmartPayQrModal from "./SmartPayQrModal";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const pkr = (n: number) => `PKR ${Number(n || 0).toLocaleString()}`;

type InstallmentRow = {
    monthNumber: number;
    label: string;
    dueDate: string | null;
    dueAmount: number;
    status: string;
    paidAt: string | null;
    paymentMethod: string | null;
    arrears?: number;
    paidAmount?: number;
    remainingAmount?: number;
    payment_history?: { amount: number; date: string; method: string }[];
};

type OrderInstallment = {
    order_id: number;
    order_ref: string;
    customer_name: string;
    whatsapp_number: string;
    product_name: string;
    imei_serial: string;
    ledger_short_id: string | null;
    purchaser: any;
    grantors: any[];
    ledgerSummaries: {
        advanceAmount: number;
        monthlyAmount: number;
        totalMonths: number;
        totalInstallmentDue: number;
        totalInstallmentPaid: number;
        totalRemaining: number;
        paidInstallments: number;
        totalInstallments: number;
    };
    installmentLedger: InstallmentRow[];
    consumer_number: string | null;
    smartpay_consumer_number: string | null;
    consumer_bill_status: string | null;
    recovery_officer: { id: number; name: string; phone: string } | null;
    tpsPayments?: any[];
};

type Props = {
    data: OrderInstallment[];
    onPay: (order: OrderInstallment, installment: InstallmentRow) => void;
    selectedIds?: number[];
    onSelectRow?: (id: number) => void;
};

export default function InstallmentsTable({ data, onPay, selectedIds = [], onSelectRow }: Props) {
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrOrderId, setQrOrderId] = useState<number | null>(null);
    const [qrMonthNumber, setQrMonthNumber] = useState<number | null>(null);
    const [qrDefaultAmount, setQrDefaultAmount] = useState<number | null>(null);
    const [qrCustomerName, setQrCustomerName] = useState("");

    const toggleRow = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider">
                            <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    onChange={(e) => {
                                        if (onSelectRow) {
                                            data.forEach(order => {
                                                if (e.target.checked && !selectedIds.includes(order.order_id)) {
                                                    onSelectRow(order.order_id);
                                                } else if (!e.target.checked && selectedIds.includes(order.order_id)) {
                                                    onSelectRow(order.order_id);
                                                }
                                            });
                                        }
                                    }}
                                />
                            </th>
                            <th className="px-6 py-4">Order Ref</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">Next Due</th>
                            <th className="px-6 py-4">Installments</th>
                            <th className="px-6 py-4">Progress</th>
                            <th className="px-6 py-4 text-center">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.map((order) => {
                            const isExpanded = expandedRows.includes(order.order_id);
                            const nextPending = order.installmentLedger.find(r => r.status === 'pending');
                            const { paidInstallments, totalInstallments, totalRemaining, advanceAmount,
                                totalInstallmentDue, totalInstallmentPaid } = order.ledgerSummaries;
                            const progress = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;
                            const allPaid = totalInstallments > 0 && paidInstallments === totalInstallments;

                            return (
                                <React.Fragment key={order.order_id}>
                                    {/* ── Summary Row ──────────────────────────────────── */}
                                    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${selectedIds.includes(order.order_id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.order_id)}
                                                onChange={() => onSelectRow?.(order.order_id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">#{order.order_ref}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {order.purchaser?.profile_photo ? (
                                                    <img
                                                        src={order.purchaser.profile_photo}
                                                        alt={order.customer_name}
                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                        {order.customer_name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">{order.customer_name}</p>
                                                    <p className="text-xs text-gray-500">{order.whatsapp_number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm dark:text-gray-300">{order.product_name}</p>
                                            <p className="text-[10px] text-gray-400">IMEI: {order.imei_serial || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {nextPending ? (
                                                <div>
                                                    <p className={`text-sm font-semibold ${nextPending.paidAmount && nextPending.paidAmount > 0 ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {pkr(nextPending.remainingAmount || nextPending.dueAmount)}
                                                    </p>
                                                    {nextPending.paidAmount && nextPending.paidAmount > 0 ? (
                                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">
                                                            Partial: {pkr(nextPending.paidAmount)}
                                                        </p>
                                                    ) : null}
                                                    {nextPending.arrears ? (
                                                        <p className="text-[10px] text-red-500 font-medium mt-0.5">
                                                            Included Arrears: {pkr(nextPending.arrears)}
                                                        </p>
                                                    ) : null}
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        {nextPending.label} · {nextPending.dueDate ? new Date(nextPending.dueDate).toLocaleDateString('en-PK') : 'N/A'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-green-500 font-semibold">✓ Fully Paid</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={`text-sm font-bold ${totalRemaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {pkr(totalRemaining)}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {paidInstallments}/{totalInstallments} paid · Adv: {pkr(advanceAmount)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${allPaid ? 'bg-green-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(100, progress)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1">{Math.round(progress)}% done</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleRow(order.order_id)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-blue-600"
                                                title={isExpanded ? "Collapse" : "Expand Ledger"}
                                            >
                                                {isExpanded ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* ── Expanded Ledger Panel ────────────────────────── */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 bg-gray-50/70 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700">

                                                <div className="flex flex-col xl:flex-row gap-8">
                                                    {/* Left Side: People Details */}
                                                    <div className="xl:w-1/3 space-y-6">
                                                        {/* Purchaser */}
                                                        <div>
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                                Purchaser Details
                                                            </h4>
                                                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                                                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                                                    {order.purchaser?.profile_photo ? (
                                                                        <img src={order.purchaser.profile_photo} className="w-full h-full object-cover" alt="" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{order.customer_name}</p>
                                                                    <p className="text-xs text-gray-500 mt-1">CNIC: {order.purchaser?.cnic_number || 'N/A'}</p>
                                                                    <p className="text-xs text-gray-500">S/O: {order.purchaser?.father_husband_name || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Grantors */}
                                                        <div>
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                Guarantors
                                                            </h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {order.grantors?.map((g, gi) => (
                                                                    <div key={gi} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                                                            {g.profile_photo ? (
                                                                                <img src={g.profile_photo} className="w-full h-full object-cover" alt="" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">{g.name}</p>
                                                                            <p className="text-[9px] text-gray-500 truncate">{g.relationship || 'Grantor'}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!order.grantors || order.grantors.length === 0) && (
                                                                    <p className="text-xs text-gray-400 italic col-span-2">No grantor data available</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Consumer Numbers */}
                                                        {order.consumer_number && (
                                                            <div>
                                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                                                    1Bill Consumer No.
                                                                </h4>
                                                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                                                    <p className="font-mono font-bold text-lg text-gray-800 dark:text-gray-100 tracking-widest">
                                                                        {order.consumer_number}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {order.smartpay_consumer_number && (
                                                            <div>
                                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    SmartPay Consumer No.
                                                                </h4>
                                                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                                                    <p className="font-mono font-bold text-lg text-gray-800 dark:text-gray-100 tracking-widest">
                                                                        {order.smartpay_consumer_number}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Recovery Officer */}
                                                        {order.recovery_officer && (
                                                            <div>
                                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                                    Recovery Officer
                                                                </h4>
                                                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 font-bold text-xs flex-shrink-0">
                                                                        {order.recovery_officer.name.charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{order.recovery_officer.name}</p>
                                                                        <p className="text-xs text-gray-500">{order.recovery_officer.phone || 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right Side: Ledger and Summaries */}
                                                    <div className="xl:w-2/3">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                            Installment Ledger
                                                        </h4>

                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                                                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 text-center">
                                                                <p className="text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-tight">Advance</p>
                                                                <p className="text-amber-800 dark:text-amber-300 text-sm font-extrabold mt-1">{pkr(advanceAmount)}</p>
                                                            </div>
                                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 text-center">
                                                                <p className="text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-tight">Total Due</p>
                                                                <p className="text-blue-800 dark:text-blue-300 text-sm font-extrabold mt-1">{pkr(totalInstallmentDue)}</p>
                                                            </div>
                                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl p-3 text-center">
                                                                <p className="text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-tight">Collected</p>
                                                                <p className="text-green-800 dark:text-green-300 text-sm font-extrabold mt-1">{pkr(totalInstallmentPaid)}</p>
                                                            </div>
                                                            <div className={`${totalRemaining > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100' : 'bg-green-50 dark:bg-green-900/20 border-green-100'} border rounded-xl p-3 text-center`}>
                                                                <p className={`${totalRemaining > 0 ? 'text-red-600' : 'text-green-600'} text-[10px] font-bold uppercase tracking-tight`}>Remaining</p>
                                                                <p className={`${totalRemaining > 0 ? 'text-red-800' : 'text-green-800'} text-sm font-extrabold mt-1`}>{pkr(totalRemaining)}</p>
                                                            </div>
                                                        </div>

                                                        {/* ── Per-Month Payment Detail Rows ── */}
                                                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                                            {/* Header */}
                                                            <div className="grid grid-cols-[52px_1fr_auto_auto_auto] gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700/60 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                                <span>Month</span>
                                                                <span>Amount / Details</span>
                                                                <span className="text-right">Paid</span>
                                                                <span className="text-right">Remaining</span>
                                                                <span className="text-center">Action</span>
                                                            </div>
                                                            {order.installmentLedger.map((inst, idx) => {
                                                                const isPaid = inst.status === 'paid';
                                                                const isPartial = inst.status === 'partial' || (!isPaid && (inst.paidAmount || 0) > 0);
                                                                const isNext = !isPaid && !isPartial && order.installmentLedger
                                                                    .filter(r => r.monthNumber < inst.monthNumber)
                                                                    .every(r => r.status === 'paid');
                                                                const instDueDate = inst.dueDate ? new Date(inst.dueDate) : null;
                                                                instDueDate?.setHours(0, 0, 0, 0);
                                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                                const isOverdue = !isPaid && instDueDate && instDueDate < today;
                                                                const hasArrears = (inst.arrears || 0) > 0;
                                                                const paidAmt = inst.paidAmount || 0;
                                                                const remAmt = inst.remainingAmount ?? (inst.dueAmount - paidAmt);

                                                                const rowBg = isPaid
                                                                    ? 'bg-green-50/50 dark:bg-green-900/5'
                                                                    : isPartial
                                                                        ? 'bg-blue-50/60 dark:bg-blue-900/10'
                                                                        : isOverdue
                                                                            ? 'bg-red-50/50 dark:bg-red-900/10'
                                                                            : isNext
                                                                                ? 'bg-orange-50/60 dark:bg-orange-900/10'
                                                                                : '';

                                                                const statusBadge = isPaid
                                                                    ? <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">✓ PAID</span>
                                                                    : isPartial
                                                                        ? <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black bg-blue-100 text-blue-700 dark:bg-blue-900/40">PARTIAL</span>
                                                                        : isOverdue
                                                                            ? <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black bg-red-100 text-red-700 dark:bg-red-900/40">OVERDUE</span>
                                                                            : isNext
                                                                                ? <span className="text-[7px] px-1.5 py-0.5 rounded-full font-black bg-orange-100 text-orange-700 dark:bg-orange-900/40">NEXT DUE</span>
                                                                                : <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black bg-gray-100 text-gray-500">PENDING</span>;

                                                                return (
                                                                    <div
                                                                        key={`${order.order_id}-inst-${inst.monthNumber}-${idx}`}
                                                                        className={`grid grid-cols-[52px_1fr_auto_auto_auto] gap-2 items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors ${rowBg}`}
                                                                    >
                                                                        {/* Month label + status */}
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <span className={`text-[10px] font-black w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPaid ? 'bg-green-100 text-green-700 dark:bg-green-900/40'
                                                                                    : isPartial ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40'
                                                                                        : isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/40'
                                                                                            : isNext ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40'
                                                                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                                                                                }`}>M{inst.monthNumber}</span>
                                                                            {statusBadge}
                                                                        </div>

                                                                        {/* Amount details */}
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                                <span className="text-sm font-extrabold text-gray-800 dark:text-gray-100">{pkr(inst.dueAmount)}</span>
                                                                                {hasArrears && (
                                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-red-100 text-red-600 dark:bg-red-900/30">+{pkr(inst.arrears || 0)} arrears</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-col gap-1 mt-1">
                                                                                <span className="text-[9px] text-gray-400">Due: {instDueDate ? instDueDate.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</span>
                                                                                {/* Render explicit payment history if available (for multiple partial payments) */}
                                                                                {inst.payment_history && inst.payment_history.length > 0 ? (
                                                                                    <div className="flex flex-col gap-1 mt-1 border-l-2 border-emerald-100 pl-2">
                                                                                        {inst.payment_history.map((ph: any, phi: number) => (
                                                                                            <div key={phi} className="flex items-center gap-1.5 flex-wrap">
                                                                                                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm">PAID: {pkr(ph.amount)}</span>
                                                                                                <span className="text-[9px] text-gray-400">on {new Date(ph.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                                                                                <span className="text-[8px] font-semibold text-indigo-500 truncate max-w-[120px]" title={ph.method}>via {ph.method}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                                                        {inst.paymentMethod && (
                                                                                            <span className="text-[9px] font-semibold text-indigo-500 truncate max-w-[140px]" title={inst.paymentMethod}>via {inst.paymentMethod}</span>
                                                                                        )}
                                                                                        {inst.paidAt && (
                                                                                            <span className="text-[9px] text-emerald-600 font-semibold">· Paid on {new Date(inst.paidAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Paid amount */}
                                                                        <div className="text-right">
                                                                            {paidAmt > 0 ? (
                                                                                <span className="text-sm font-black text-emerald-600">{pkr(paidAmt)}</span>
                                                                            ) : (
                                                                                <span className="text-[10px] text-gray-300">—</span>
                                                                            )}
                                                                        </div>

                                                                        {/* Remaining */}
                                                                        <div className="text-right">
                                                                            {!isPaid && remAmt > 0 ? (
                                                                                <span className="text-sm font-black text-red-500">{pkr(remAmt)}</span>
                                                                            ) : isPaid ? (
                                                                                <span className="text-[10px] text-green-500 font-bold">✓ Done</span>
                                                                            ) : (
                                                                                <span className="text-[10px] text-gray-300">—</span>
                                                                            )}
                                                                        </div>

                                                                        {/* Action */}
                                                                        <div className="flex justify-center gap-2 items-center">
                                                                            {isPaid ? (
                                                                                <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                                                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => onPay(order, inst)}
                                                                                        className={`text-[9px] font-black py-1.5 px-3 rounded-lg shadow-sm transition-opacity hover:opacity-80 ${isNext ? 'bg-orange-500 text-white' : isOverdue ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}
                                                                                    >
                                                                                        {isPartial ? 'PAY REST' : 'PAY'}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setQrOrderId(order.order_id);
                                                                                            setQrMonthNumber(inst.monthNumber);
                                                                                            setQrDefaultAmount(remAmt);
                                                                                            setQrCustomerName(order.customer_name);
                                                                                            setQrModalOpen(true);
                                                                                        }}
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
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const printWindow = window.open('', '_blank');
                                                                if (printWindow) {
                                                                    printWindow.document.write(`
                                                                        <html>
                                                                            <head>
                                                                                <title>Order Details - ${order.order_ref}</title>
                                                                                <style>
                                                                                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                                                                                    h1, h2, h3 { margin-top: 0; }
                                                                                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                                                                                    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
                                                                                    .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
                                                                                    table { w-full; border-collapse: collapse; margin-top: 20px; width: 100%; }
                                                                                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                                                                    th { background-color: #f9f9f9; }
                                                                                    .status-paid { color: #16a34a; font-weight: bold; }
                                                                                    .status-partial { color: #2563eb; font-weight: bold; }
                                                                                    .status-pending { color: #ea580c; font-weight: bold; }
                                                                                    .summary-box { display: flex; justify-content: space-between; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px; }
                                                                                    .summary-item { text-align: center; }
                                                                                    .summary-value { font-size: 1.2rem; font-weight: bold; margin-top: 5px; color: #0f172a; }
                                                                                    @media print { body { padding: 0; } .no-print { display: none; } }
                                                                                </style>
                                                                            </head>
                                                                            <body>
                                                                                <div class="header">
                                                                                    <div>
                                                                                        <h1>Qist Market - Order Summary</h1>
                                                                                        <p>Order Reference: <strong>#${order.order_ref}</strong></p>
                                                                                        <p>Product: <strong>${order.product_name}</strong> (IMEI: ${order.imei_serial || 'N/A'})</p>
                                                                                    </div>
                                                                                    <div style="text-align: right;">
                                                                                        <p>Date Printed: ${new Date().toLocaleDateString()}</p>
                                                                                    </div>
                                                                                </div>

                                                                                <div class="summary-box">
                                                                                    <div class="summary-item">
                                                                                        <div style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;">Total Due</div>
                                                                                        <div class="summary-value">${pkr(totalInstallmentDue)}</div>
                                                                                    </div>
                                                                                    <div class="summary-item">
                                                                                        <div style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;">Total Collected</div>
                                                                                        <div class="summary-value" style="color: #16a34a;">${pkr(totalInstallmentPaid)}</div>
                                                                                    </div>
                                                                                    <div class="summary-item">
                                                                                        <div style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;">Remaining Balance</div>
                                                                                        <div class="summary-value" style="color: #dc2626;">${pkr(totalRemaining)}</div>
                                                                                    </div>
                                                                                </div>

                                                                                <div class="grid-2">
                                                                                    <div class="card">
                                                                                        <h3>Purchaser Details</h3>
                                                                                        <p><strong>Name:</strong> ${order.customer_name}</p>
                                                                                        <p><strong>Phone:</strong> ${order.whatsapp_number}</p>
                                                                                        <p><strong>CNIC:</strong> ${order.purchaser?.cnic_number || 'N/A'}</p>
                                                                                        <p><strong>Father/Husband:</strong> ${order.purchaser?.father_husband_name || 'N/A'}</p>
                                                                                    </div>
                                                                                    <div class="card">
                                                                                        <h3>Guarantors Details</h3>
                                                                                        ${order.grantors?.map(g => `
                                                                                            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                                                                                                <p style="margin:0 0 5px 0;"><strong>${g.name}</strong> (${g.relationship || 'Grantor'})</p>
                                                                                                <p style="margin:0; font-size: 0.9em; color: #555;">CNIC: ${g.cnic_number || 'N/A'} | Phone: ${g.phone_number || 'N/A'}</p>
                                                                                            </div>
                                                                                        `).join('') || '<p>No guarantors data</p>'}
                                                                                    </div>
                                                                                </div>

                                                                                <h3>Installment Ledger Overview</h3>
                                                                                <table>
                                                                                    <thead>
                                                                                        <tr>
                                                                                            <th>Month</th>
                                                                                            <th>Amount Due</th>
                                                                                            <th>Paid</th>
                                                                                            <th>Remaining</th>
                                                                                            <th>Status</th>
                                                                                            <th>Due Date</th>
                                                                                            <th>Payment Date</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        ${order.installmentLedger.map(inst => `
                                                                                            <tr>
                                                                                                <td>${inst.label || `Month ${inst.monthNumber}`}</td>
                                                                                                <td style="font-weight:bold;">${pkr(inst.dueAmount)} ${inst.arrears ? ` <div style="color:#ef4444; font-size:10px;">(+ ${pkr(inst.arrears)} arr)</div>` : ''}</td>
                                                                                                <td style="color:#16a34a; font-weight:bold;">${inst.paidAmount && inst.paidAmount > 0 ? pkr(inst.paidAmount) : '-'}</td>
                                                                                                <td style="color:#dc2626; font-weight:bold;">${inst.remainingAmount && inst.remainingAmount > 0 ? pkr(inst.remainingAmount) : '-'}</td>
                                                                                                <td class="status-${(inst.paidAmount && inst.paidAmount > 0 && inst.status !== 'paid') ? 'partial' : (inst.status || 'pending').toLowerCase()}">${(inst.paidAmount && inst.paidAmount > 0 && inst.status !== 'paid') ? 'PARTIAL' : (inst.status || 'PENDING').toUpperCase()}</td>
                                                                                                <td>${inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : 'N/A'}</td>
                                                                                                <td>${inst.paidAt ? new Date(inst.paidAt).toLocaleDateString() : '-'}</td>
                                                                                            </tr>
                                                                                        `).join('')}
                                                                                    </tbody>
                                                                                </table>
                                                                                
                                                                                <div style="margin-top: 50px; text-align: center; color: #888; font-size: 0.9em;">
                                                                                    <p>Generated by Qist Market Software Dashboard</p>
                                                                                </div>
                                                                            </body>
                                                                        </html>
                                                                    `);
                                                                    printWindow.document.close();
                                                                    printWindow.focus();
                                                                    setTimeout(() => {
                                                                        printWindow.print();
                                                                    }, 250);
                                                                }
                                                            }}
                                                            className="flex items-center gap-2 text-[11px] font-bold text-gray-600 hover:text-gray-800 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-4 py-2 rounded-xl transition-all"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4" /></svg>
                                                            Print
                                                        </button>
                                                    </div>
                                                    {order.ledger_short_id && (
                                                        <a
                                                            href={`${API_BASE}/api/ledger/${order.ledger_short_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl transition-all"
                                                        >
                                                            View Online Ledger →
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>

                {data.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="bg-gray-50 dark:bg-gray-800 inline-block p-6 rounded-full mb-4">
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white">No delivered orders found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">
                            Once orders are delivered, they will appear here for installment tracking and collection.
                        </p>
                    </div>
                )}
            </div>

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
