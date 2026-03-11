"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type Expense = { id: number; expense_type: string; amount: number; description?: string; expense_date: string; };

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ expense_type: "", amount: "", description: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(""); const [success, setSuccess] = useState("");

    const EXPENSE_TYPES = ["Rent", "Electricity", "Internet", "Salary", "Maintenance", "Fuel", "Other"];

    useEffect(() => { fetchExpenses(); }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/expenses`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setExpenses(data.expenses);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError(""); setSuccess("");
        try {
            const res = await fetch(`${API_BASE}/api/outlet/expenses`, {
                method: "POST", headers: getAuthHeaders(),
                body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
            });
            const data = await res.json();
            if (data.success) { setSuccess("Expense recorded!"); setForm({ expense_type: "", amount: "", description: "" }); setShowForm(false); fetchExpenses(); }
            else setError(data.message || "Failed.");
        } catch { setError("Network error."); } finally { setSaving(false); }
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Expense Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Total Expenses: <strong className="text-red-600">PKR {totalExpenses.toLocaleString()}</strong></p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    {showForm ? "Cancel" : "+ Add Expense"}
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6 mb-6">
                    {error && <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                    {success && <div className="mb-3 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Type *</label>
                            <select value={form.expense_type} onChange={e => setForm({ ...form, expense_type: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                                <option value="">Select type</option>
                                {EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (PKR) *</label>
                            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes..." className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                        </div>
                        <div className="sm:col-span-2">
                            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-medium">
                                {saving ? "Saving..." : "Add Expense"}
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
                                {["#", "Type", "Amount", "Description", "Date"].map(h => <th key={h} className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {expenses.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-500">No expenses recorded.</td></tr>
                                    : expenses.map((e, i) => (
                                        <tr key={e.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{i + 1}</td>
                                            <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{e.expense_type}</td>
                                            <td className="px-5 py-3 text-red-600 dark:text-red-400 font-medium">PKR {e.amount.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{e.description || "—"}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{new Date(e.expense_date).toLocaleDateString()}</td>
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
