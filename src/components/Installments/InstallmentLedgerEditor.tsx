import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { Calendar, Trash2, Plus, ArrowRight, Smartphone, Key, Camera, CheckCircle2, UserCheck, Calculator, AlertCircle } from 'lucide-react';

interface LedgerRow {
    month: number;
    date: string;
    amount: number;
}

interface InstallmentLedgerEditorProps {
    totalPrice: number;
    advance: number;
    months: number;
    monthlyAmount: number;
    onLedgerChange: (ledger: LedgerRow[]) => void;
}

export const InstallmentLedgerEditor = ({
    totalPrice,
    advance,
    months,
    monthlyAmount,
    onLedgerChange
}: InstallmentLedgerEditorProps) => {
    const [ledger, setLedger] = useState<LedgerRow[]>([]);
    const today = dayjs();

    // Initial ledger generation
    useEffect(() => {
        const initialLedger = Array.from({ length: months }, (_, i) => ({
            month: i + 1,
            date: today.add(i + 1, 'month').format('YYYY-MM-DD'),
            amount: monthlyAmount,
        }));
        setLedger(initialLedger);
    }, [months, monthlyAmount]);

    // Notify parent of changes
    useEffect(() => {
        onLedgerChange(ledger);
    }, [ledger]);

    const updateLedgerRow = (index: number, field: keyof LedgerRow, value: string | number) => {
        const updated = [...ledger];
        const row = { ...updated[index], [field]: value };

        if (field === 'amount') {
            const newAmount = Number(value);
            const diff = ledger[index].amount - newAmount;
            updated[index] = { ...row, amount: newAmount };

            // Redistribute difference to remaining months
            const remainingMonths = updated.length - (index + 1);
            if (remainingMonths > 0) {
                const adjustment = Math.floor(diff / remainingMonths);
                const remainder = diff % remainingMonths;

                for (let i = index + 1; i < updated.length; i++) {
                    updated[i].amount += adjustment;
                    if (i === updated.length - 1) {
                        updated[i].amount += remainder;
                    }
                }
            }
        } else {
            updated[index] = row as LedgerRow;
        }

        setLedger(updated);
    };

    const totalInLedger = ledger.reduce((sum, r) => sum + Number(r.amount), 0);
    const balanceRemaining = (totalPrice - advance) - totalInLedger;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Balance to Distribute</p>
                    <p className={cn("text-lg font-black", balanceRemaining === 0 ? "text-emerald-600" : "text-amber-600")}>
                        Rs. {(totalPrice - advance).toLocaleString()}
                    </p>
                </div>
                {balanceRemaining !== 0 && (
                   <div className="flex items-center gap-2 text-amber-600 animate-pulse">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-xs font-bold">Unbalanced: {balanceRemaining.toLocaleString()}</span>
                   </div>
                )}
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <tr className="border-b border-gray-100 dark:border-strokedark">
                            <th className="py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Month</th>
                            <th className="py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</th>
                            <th className="py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-strokedark">
                        {ledger.map((r, index) => (
                            <tr key={r.month} className="hover:bg-gray-50/50 dark:hover:bg-meta-4/10 transition-colors">
                                <td className="py-3 text-sm font-bold text-gray-900 dark:text-white">{r.month}</td>
                                <td className="py-3">
                                    <input
                                        type="date"
                                        value={r.date}
                                        min={today.format('YYYY-MM-DD')}
                                        onChange={e => updateLedgerRow(index, 'date', e.target.value)}
                                        className="bg-transparent border-none p-0 text-sm font-medium text-gray-600 dark:text-gray-400 outline-none focus:text-primary transition-colors cursor-pointer"
                                    />
                                </td>
                                <td className="py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-[10px] text-gray-400 font-bold">Rs.</span>
                                        <input
                                            type="number"
                                            value={r.amount}
                                            min={1}
                                            onChange={e => updateLedgerRow(index, 'amount', e.target.value)}
                                            className="w-24 bg-transparent border-none p-0 text-sm font-black text-gray-900 dark:text-white outline-none focus:text-primary text-right transition-colors"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Installments</span>
                <span className="text-sm font-black text-emerald-700">Rs. {totalInLedger.toLocaleString()}</span>
            </div>
        </div>
    );
};
