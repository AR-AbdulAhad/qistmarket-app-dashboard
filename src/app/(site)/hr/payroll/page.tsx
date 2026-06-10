"use client";

import { useEffect, useState } from "react";
import { hrFetch } from "@/lib/employee-api";
import { Search, Plus, Edit3 } from "lucide-react";
import toast from "react-hot-toast";

interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  department?: string;
}

interface PayrollSlip {
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

export default function HrPayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);
  const [slips, setSlips] = useState<PayrollSlip[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editSlip, setEditSlip] = useState<PayrollSlip | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    hrFetch("/employees").then((r) => setEmployees(r.employees));
  }, []);

  useEffect(() => {
    if (!selectedEmp) return;
    hrFetch(`/employees/${selectedEmp}/payroll`).then((r) => setSlips(r.slips));
  }, [selectedEmp]);

  const createSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    await hrFetch(`/employees/${selectedEmp}/payroll`, {
      method: "POST",
      body: JSON.stringify({
        month: parseInt(data.get("month") as string),
        year: parseInt(data.get("year") as string),
        basic_salary: parseFloat(data.get("basic_salary") as string),
        allowances: parseFloat(data.get("allowances") as string) || 0,
        bonuses: parseFloat(data.get("bonuses") as string) || 0,
        commissions: parseFloat(data.get("commissions") as string) || 0,
        deductions: parseFloat(data.get("deductions") as string) || 0,
      }),
    });
    toast.success("Payroll slip created");
    setShowCreate(false);
    const r = await hrFetch(`/employees/${selectedEmp}/payroll`);
    setSlips(r.slips);
  };

  const updateSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSlip) return;
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    await hrFetch(`/payroll/${editSlip.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        basic_salary: parseFloat(data.get("basic_salary") as string),
        allowances: parseFloat(data.get("allowances") as string) || 0,
        bonuses: parseFloat(data.get("bonuses") as string) || 0,
        commissions: parseFloat(data.get("commissions") as string) || 0,
        deductions: parseFloat(data.get("deductions") as string) || 0,
        status: data.get("status") as string,
      }),
    });
    toast.success("Payroll slip updated");
    setEditSlip(null);
    const r = await hrFetch(`/employees/${selectedEmp}/payroll`);
    setSlips(r.slips);
  };

  const filtered = employees.filter((e) =>
    e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Payroll Management</h1>
        {selectedEmp && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> New Slip
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." className="w-full rounded-lg border border-stroke py-2 pl-9 pr-3 text-sm dark:border-stroke-dark dark:bg-dark-2" />
        </div>
        <select value={selectedEmp || ""} onChange={(e) => setSelectedEmp(e.target.value ? parseInt(e.target.value) : null)} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2">
          <option value="">Select employee</option>
          {filtered.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>
          ))}
        </select>
      </div>

      {(showCreate || editSlip) && (
        <form onSubmit={editSlip ? updateSlip : createSlip} className="mb-6 rounded-xl border border-stroke bg-white p-4 dark:border-stroke-dark dark:bg-dark-2">
          <h3 className="mb-3 font-semibold">{editSlip ? `Edit Slip (${editSlip.month}/${editSlip.year})` : "Create Payroll Slip"}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {editSlip ? (
              <>
                <input name="basic_salary" type="number" step="0.01" defaultValue={editSlip.basic_salary} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" placeholder="Basic" />
                <input name="allowances" type="number" step="0.01" defaultValue={editSlip.allowances} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" placeholder="Allowances" />
                <input name="bonuses" type="number" step="0.01" defaultValue={editSlip.bonuses} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" placeholder="Bonuses" />
                <input name="commissions" type="number" step="0.01" defaultValue={editSlip.commissions} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" placeholder="Commissions" />
                <input name="deductions" type="number" step="0.01" defaultValue={editSlip.deductions} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" placeholder="Deductions" />
                <select name="status" defaultValue={editSlip.status} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </>
            ) : (
              <>
                <input name="month" type="number" min="1" max="12" placeholder="Month (1-12)" required className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" />
                <input name="year" type="number" placeholder="Year" required className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" />
                <input name="basic_salary" type="number" step="0.01" placeholder="Basic salary" required className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" />
                <input name="allowances" type="number" step="0.01" placeholder="Allowances (0)" className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" />
                <input name="bonuses" type="number" step="0.01" placeholder="Bonuses (0)" className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" />
                <input name="commissions" type="number" step="0.01" placeholder="Commissions (0)" className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" />
                <input name="deductions" type="number" step="0.01" placeholder="Deductions (0)" className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2" />
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm text-white">{editSlip ? "Update" : "Create"}</button>
            <button type="button" onClick={() => { setShowCreate(false); setEditSlip(null); }} className="rounded-lg border border-stroke px-4 py-2 text-sm dark:border-stroke-dark">Cancel</button>
          </div>
        </form>
      )}

      {selectedEmp ? (
        <div className="overflow-x-auto rounded-xl border border-stroke bg-white dark:border-stroke-dark dark:bg-dark-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke bg-gray-2 dark:border-stroke-dark dark:bg-dark-3">
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-right">Basic</th>
                <th className="px-4 py-3 text-right">Allowances</th>
                <th className="px-4 py-3 text-right">Bonuses</th>
                <th className="px-4 py-3 text-right">Commissions</th>
                <th className="px-4 py-3 text-right">Deductions</th>
                <th className="px-4 py-3 text-right">Net Payable</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slips.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No payroll slips</td></tr>
              )}
              {slips.map((slip) => {
                const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                return (
                  <tr key={slip.id} className="border-b border-stroke dark:border-stroke-dark">
                    <td className="px-4 py-3">{months[slip.month - 1]} {slip.year}</td>
                    <td className="px-4 py-3 text-right">Rs. {slip.basic_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">Rs. {slip.allowances.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">Rs. {slip.bonuses.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">Rs. {slip.commissions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">Rs. {slip.deductions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold">Rs. {slip.net_payable.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        slip.status === "paid" ? "bg-green/10 text-green" :
                        slip.status === "pending" ? "bg-yellow-light-4/20 text-yellow-dark" : "bg-red/10 text-red"
                      }`}>{slip.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setEditSlip(slip)} className="text-xs text-primary hover:underline">
                        <Edit3 className="mr-1 inline h-3 w-3" /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">Select an employee to view payroll.</p>
      )}
    </div>
  );
}
