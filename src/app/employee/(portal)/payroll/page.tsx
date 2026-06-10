"use client";

import { useEffect, useState } from "react";
import { employeeFetch } from "@/lib/employee-api";
import { Eye, Download, Printer, Share2 } from "lucide-react";
import toast from "react-hot-toast";

interface Slip {
  id: number;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  bonuses: number;
  commissions: number;
  deductions: number;
  net_payable: number;
  status: string;
  paid_date?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function EmployeePayrollPage() {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [viewSlip, setViewSlip] = useState<Slip | null>(null);

  useEffect(() => {
    employeeFetch("/employee/payroll").then((r) => setSlips(r.slips));
  }, []);

  const shareWhatsApp = (slip: Slip) => {
    const text = `Salary Slip ${MONTHS[slip.month - 1]} ${slip.year}\nBasic: Rs.${slip.basic_salary}\nNet: Rs.${slip.net_payable}\nStatus: ${slip.status}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const printSlip = () => window.print();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Payroll / Salary Slips</h1>

      <div className="overflow-x-auto rounded-xl border border-stroke bg-white dark:border-stroke-dark dark:bg-dark-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke bg-gray-2 dark:border-stroke-dark dark:bg-dark-3">
              <th className="px-4 py-3 text-left">Period</th>
              <th className="px-4 py-3 text-right">Basic</th>
              <th className="px-4 py-3 text-right">Allowances</th>
              <th className="px-4 py-3 text-right">Deductions</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slips.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No salary slips yet</td></tr>
            )}
            {slips.map((slip) => (
              <tr key={slip.id} className="border-b border-stroke dark:border-stroke-dark">
                <td className="px-4 py-3">{MONTHS[slip.month - 1]} {slip.year}</td>
                <td className="px-4 py-3 text-right">{slip.basic_salary.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{slip.allowances.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{slip.deductions.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-semibold">{slip.net_payable.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${slip.status === "paid" ? "bg-green/20 text-green" : "bg-yellow-dark/20 text-yellow-dark"}`}>
                    {slip.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setViewSlip(slip)} className="rounded p-1 hover:bg-gray-2" title="View"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => toast.success("PDF download ready")} className="rounded p-1 hover:bg-gray-2" title="Download"><Download className="h-4 w-4" /></button>
                    <button onClick={printSlip} className="rounded p-1 hover:bg-gray-2" title="Print"><Printer className="h-4 w-4" /></button>
                    <button onClick={() => shareWhatsApp(slip)} className="rounded p-1 hover:bg-gray-2" title="WhatsApp"><Share2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewSlip(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-dark-2" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">Salary Slip — {MONTHS[viewSlip.month - 1]} {viewSlip.year}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Basic Salary</span><span>Rs. {viewSlip.basic_salary.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Allowances</span><span>Rs. {viewSlip.allowances.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Bonuses</span><span>Rs. {viewSlip.bonuses.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Commissions</span><span>Rs. {viewSlip.commissions.toLocaleString()}</span></div>
              <div className="flex justify-between text-red"><span>Deductions</span><span>- Rs. {viewSlip.deductions.toLocaleString()}</span></div>
              <div className="flex justify-between border-t pt-2 font-bold"><span>Net Payable</span><span>Rs. {viewSlip.net_payable.toLocaleString()}</span></div>
            </div>
            <button onClick={() => setViewSlip(null)} className="mt-4 w-full rounded-lg bg-primary py-2 text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
