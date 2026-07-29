import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatExactDate } from '@/utils/dateUtils';

export const PaymentDetailsSection = ({ paymentDetails, title = "Payment Details" }: { paymentDetails: any, title?: string }) => {
    const [expandedInstallments, setExpandedInstallments] = useState(true);

    if (!paymentDetails) return null;

    return (
        <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-dark dark:text-white">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                {title}
            </h3>

            {/* Advance Payment */}
            {paymentDetails.advance_payment && (
                <div className="mb-4 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3">
                    <h4 className="mb-3 font-medium text-dark dark:text-white">Advance Payment</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Amount</label>
                            <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                                Rs. {paymentDetails.advance_payment.amount?.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Payment Method</label>
                            <p className="mt-1 text-dark dark:text-white">{paymentDetails.advance_payment.payment_method || 'Cash'}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                            <span className={cn(
                                "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                                paymentDetails.advance_payment.status === 'paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {paymentDetails.advance_payment.status}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Payment Date</label>
                            <p className="mt-1 text-sm text-dark dark:text-white">
                                {paymentDetails.advance_payment.paid_at ? formatExactDate(paymentDetails.advance_payment.paid_at) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Installment Plan */}
            {paymentDetails.installment_plan && (
                <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h4 className="font-medium text-dark dark:text-white">Installment Plan</h4>
                        {paymentDetails.installment_plan.token && (
                            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-mono dark:bg-dark-2">
                                Token: {paymentDetails.installment_plan.token}
                            </span>
                        )}
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-800">
                            <p className="text-2xl font-bold text-primary">
                                {paymentDetails.installment_plan.summary?.total_installments || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Installments</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-800">
                            <p className="text-2xl font-bold text-green-600">
                                {paymentDetails.installment_plan.summary?.paid_installments || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-800">
                            <p className="text-2xl font-bold text-yellow-600">
                                {paymentDetails.installment_plan.summary?.pending_installments || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-800">
                            <p className="text-sm font-bold text-dark dark:text-white">
                                Rs. {paymentDetails.installment_plan.summary?.total_paid_amount?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Paid / {paymentDetails.installment_plan.summary?.total_due_amount?.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {paymentDetails.installment_plan.summary?.total_installments > 0 && (
                        <div className="mb-4">
                            <div className="mb-1 flex justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-400">Payment Progress</span>
                                <span className="font-medium text-dark dark:text-white">
                                    {Math.round((paymentDetails.installment_plan.summary?.paid_installments / 
                                       paymentDetails.installment_plan.summary?.total_installments) * 100)}%
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div 
                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                    style={{ 
                                        width: `${(paymentDetails.installment_plan.summary?.paid_installments / 
                                                 paymentDetails.installment_plan.summary?.total_installments) * 100}%` 
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Installments Table */}
                    {paymentDetails.installment_plan.installments?.length > 0 && (
                        <div className="mt-4">
                            <button
                                onClick={() => setExpandedInstallments(!expandedInstallments)}
                                className="mb-3 flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-left text-sm font-medium text-dark shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                            >
                                <span>Installment Schedule</span>
                                <svg 
                                    className={cn("h-4 w-4 transition-transform", expandedInstallments && "rotate-180")}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {expandedInstallments && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-100 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Month</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Due Date</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Amount Due</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Paid</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Remaining</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Payment Date</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Method</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {paymentDetails.installment_plan.installments.map((inst: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-4 py-2 text-sm text-dark dark:text-white">{inst.label || `Month ${inst.month}`}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                                        {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm font-medium text-dark dark:text-white">
                                                        Rs. {inst.due_amount?.toLocaleString()}
                                                        {inst.arrears > 0 && (
                                                            <div className="text-[10px] text-red-500 font-medium">
                                                                +{inst.arrears?.toLocaleString()} arr
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm font-bold text-green-600 dark:text-green-400">
                                                        {inst.paid_amount > 0 ? `Rs. ${inst.paid_amount.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm font-bold text-red-500">
                                                        {inst.remaining_amount > 0 ? `Rs. ${inst.remaining_amount.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className={cn(
                                                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                                                            inst.status === 'paid' 
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                                                : (inst.paid_amount > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400")
                                                        )}>
                                                            {inst.paid_amount > 0 && inst.status !== 'paid' ? 'Partial' : inst.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                                        {inst.paid_at ? new Date(inst.paid_at).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                                        {inst.payment_method || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
