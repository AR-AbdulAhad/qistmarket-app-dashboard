"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type Payment = { id: number; vendor_name: string; amount: number; payment_method: string; payment_date: string; };

const PAYMENT_METHOD_COLORS: Record<string, string> = {
    "Cash": "bg-green-100 text-green-700",
    "Bank Transfer": "bg-blue-100 text-blue-700",
    "Easypaisa": "bg-emerald-100 text-emerald-700",
    "JazzCash": "bg-red-100 text-red-700",
};

export default function VendorPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ vendor_name: "", amount: "", payment_method: "Cash" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(""); const [success, setSuccess] = useState("");

    useEffect(() => { fetchPayments(); }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/vendors/payments`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setPayments(data.payments);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError(""); setSuccess("");
        try {
            const res = await fetch(`${API_BASE}/api/outlet/vendors/payments`, {
                method: "POST", headers: getAuthHeaders(),
                body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
            });
            const data = await res.json();
            if (data.success) { setSuccess("Payment recorded!"); setForm({ vendor_name: "", amount: "", payment_method: "Cash" }); setShowForm(false); fetchPayments(); }
            else setError(data.message || "Failed.");
        } catch { setError("Network error."); } finally { setSaving(false); }
    };

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Vendor Payments</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Vendor ledger — Total Paid: <strong>PKR {totalPaid.toLocaleString()}</strong></p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    {showForm ? "Cancel" : "+ Record Payment"}
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6 mb-6">
                    {error && <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                    {success && <div className="mb-3 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Name *</label>
                            <input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} placeholder="Vendor name" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (PKR) *</label>
                            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                            <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                                {["Cash", "Bank Transfer", "Easypaisa", "JazzCash"].map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-3">
                            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-medium">
                                {saving ? "Saving..." : "Record Payment"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50 dark:bg-gray-700 text-left">
                                {["#", "Vendor", "Amount", "Method", "Date"].map(h => <th key={h} className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {payments.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-500">No payments recorded.</td></tr>
                                    : payments.map((p, i) => (
                                        <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{i + 1}</td>
                                            <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{p.vendor_name}</td>
                                            <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">PKR {p.amount.toLocaleString()}</td>
                                            <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_METHOD_COLORS[p.payment_method] || "bg-gray-100 text-gray-700"}`}>{p.payment_method}</span></td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{new Date(p.payment_date).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
