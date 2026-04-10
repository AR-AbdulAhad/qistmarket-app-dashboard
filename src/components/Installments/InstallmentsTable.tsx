"use client";

import React, { useState } from "react";

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
};

type OrderInstallment = {
    order_id: number;
    order_ref: string;
    customer_name: string;
    whatsapp_number: string;
    product_name: string;
    imei_serial: string;
    ledger_short_id: string | null;
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
};

type Props = {
    data: OrderInstallment[];
    onPay: (order: OrderInstallment, installment: InstallmentRow) => void;
};

export default function InstallmentsTable({ data, onPay }: Props) {
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

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
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">#{order.order_ref}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-800 dark:text-gray-200">{order.customer_name}</p>
                                            <p className="text-xs text-gray-500">{order.whatsapp_number}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm dark:text-gray-300">{order.product_name}</p>
                                            <p className="text-[10px] text-gray-400">IMEI: {order.imei_serial || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {nextPending ? (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        {pkr(nextPending.dueAmount)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
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
                                            <td colSpan={7} className="px-6 py-5 bg-gray-50/70 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700">

                                                {/* Financial Summary Bar */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 text-center">
                                                        <p className="text-amber-700 dark:text-amber-400 text-xs font-bold uppercase">Advance</p>
                                                        <p className="text-amber-800 dark:text-amber-300 text-base font-extrabold mt-1">{pkr(advanceAmount)}</p>
                                                        <p className="text-[10px] text-amber-600 mt-0.5">✓ Collected at Delivery</p>
                                                    </div>
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 text-center">
                                                        <p className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase">Installments</p>
                                                        <p className="text-blue-800 dark:text-blue-300 text-base font-extrabold mt-1">{pkr(totalInstallmentDue)}</p>
                                                        <p className="text-[10px] text-blue-500 mt-0.5">{totalInstallments} months total</p>
                                                    </div>
                                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl p-3 text-center">
                                                        <p className="text-green-600 dark:text-green-400 text-xs font-bold uppercase">Collected</p>
                                                        <p className="text-green-800 dark:text-green-300 text-base font-extrabold mt-1">{pkr(totalInstallmentPaid)}</p>
                                                        <p className="text-[10px] text-green-500 mt-0.5">{paidInstallments} months paid</p>
                                                    </div>
                                                    <div className={`${totalRemaining > 0
                                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'
                                                        : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'} border rounded-xl p-3 text-center`}>
                                                        <p className={`${totalRemaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} text-xs font-bold uppercase`}>
                                                            Remaining
                                                        </p>
                                                        <p className={`${totalRemaining > 0 ? 'text-red-800 dark:text-red-300' : 'text-green-700 dark:text-green-300'} text-base font-extrabold mt-1`}>
                                                            {pkr(totalRemaining)}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{totalInstallments - paidInstallments} months left</p>
                                                    </div>
                                                </div>

                                                {/* Installment Month Cards */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                                    {order.installmentLedger.map((inst, idx) => {
                                                        const isPaid = inst.status === 'paid';
                                                        const isNext = !isPaid && order.installmentLedger
                                                            .filter(r => r.monthNumber < inst.monthNumber)
                                                            .every(r => r.status === 'paid');

                                                        return (
                                                            <div
                                                                key={`${order.order_id}-inst-${inst.monthNumber}-${idx}`}
                                                                className={`rounded-xl p-3 border transition-all ${
                                                                    isPaid
                                                                        ? 'bg-green-50/60 border-green-200 dark:bg-green-900/10 dark:border-green-900/30'
                                                                        : isNext
                                                                        ? 'bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700 ring-2 ring-orange-300/40'
                                                                        : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700 shadow-sm'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start gap-1">
                                                                    <div className="min-w-0">
                                                                        <p className={`text-[9px] uppercase font-bold truncate ${isNext ? 'text-orange-600' : 'text-gray-500'}`}>
                                                                            {inst.label || `Month ${inst.monthNumber}`}
                                                                            {isNext && ' ←'}
                                                                        </p>
                                                                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mt-0.5">
                                                                            {pkr(inst.dueAmount)}
                                                                        </p>
                                                                    </div>
                                                                    {isPaid ? (
                                                                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full flex-shrink-0">
                                                                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => onPay(order, inst)}
                                                                            className={`text-[9px] font-bold py-1 px-2 rounded-full transition-all shadow-sm flex-shrink-0 ${
                                                                                isNext
                                                                                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                            }`}
                                                                        >
                                                                            PAY
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="mt-2 text-[9px] text-gray-400 space-y-0.5">
                                                                    <p>Due: {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-PK') : 'N/A'}</p>
                                                                    {isPaid && inst.paidAt && (
                                                                        <p className="text-green-600 font-medium">
                                                                            Paid: {new Date(inst.paidAt).toLocaleDateString('en-PK')}
                                                                            {inst.paymentMethod ? ` · ${inst.paymentMethod}` : ''}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* View Ledger Button */}
                                                {order.ledger_short_id && (
                                                    <div className="mt-4 flex justify-end">
                                                        <a
                                                            href={`${API_BASE}/api/ledger/${order.ledger_short_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            View Full Ledger
                                                        </a>
                                                    </div>
                                                )}
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
        </div>
    );
}
