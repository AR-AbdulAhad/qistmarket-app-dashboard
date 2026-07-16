"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PageHeader from "@/components/Accounts/PageHeader";
import { PKR } from "@/components/Accounts/StatCard";
import { calculateInstallmentPlans, EMI_CATEGORIES } from "@/lib/emiCalculator";

export default function AdminEmiCalculatorPage() {
  const [category, setCategory] = useState(EMI_CATEGORIES[0]);
  const [price, setPrice] = useState("");

  const plans = useMemo(() => {
    const p = parseFloat(price);
    if (!p || p <= 0) return [];
    return calculateInstallmentPlans(category, p);
  }, [category, price]);

  return (
    <>
      <Breadcrumb pageName="EMI Calculator" />
      <PageHeader icon={Calculator} title="EMI Calculator" subtitle="Uses the exact tiered profit/advance formula applied at order creation." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-xl">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-gray-dark dark:text-white">
            {EMI_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Cash Price (PKR)</label>
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 85000" className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-white/10 dark:bg-boxdark">
          Enter a cash price to see installment plan options.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-boxdark">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-2 dark:text-gray-400">
              <tr><th className="px-4 py-3 font-bold">Months</th><th className="px-4 py-3 text-right font-bold">Advance</th><th className="px-4 py-3 text-right font-bold">Monthly</th><th className="px-4 py-3 text-right font-bold">Total Price</th><th className="px-4 py-3 text-right font-bold">Markup</th></tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.months} className="border-t border-slate-50 dark:border-white/5">
                  <td className="px-4 py-3.5 font-bold text-dark dark:text-white">{p.months}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{PKR(p.advanceAmount)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-[#ff3d3d]">{PKR(p.monthlyAmount)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-dark dark:text-white">{PKR(p.totalPrice)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-emerald-600">{(p.profit * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
