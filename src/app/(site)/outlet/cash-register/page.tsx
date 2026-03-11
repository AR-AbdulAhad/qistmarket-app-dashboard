"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type Register = {
    id: number;
    date: string;
    opening_cash: number;
    down_payments: number;
    installments_received: number;
    cash_from_recovery: number;
    cash_from_delivery: number;
    expenses: number;
    closing_cash: number;
};

export default function CashRegisterPage() {
    const [registers, setRegisters] = useState<Register[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => { fetchRegisters(); }, []);

    const fetchRegisters = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-register`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setRegisters(data.registers);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCalculate = async () => {
        setCalculating(true); setMessage("");
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-register/calculate`, { method: "POST", headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) { setMessage("Today's cash register calculated!"); fetchRegisters(); }
            else setMessage(data.message || "Failed.");
        } catch { setMessage("Network error."); } finally { setCalculating(false); }
    };

    const fields = [
        { key: "opening_cash", label: "Opening Cash" },
        { key: "down_payments", label: "Down Payments" },
        { key: "installments_received", label: "Installments Received" },
        { key: "cash_from_recovery", label: "Cash from Recovery Officers" },
        { key: "cash_from_delivery", label: "Cash from Delivery Officers" },
        { key: "expenses", label: "Expenses (–)" },
        { key: "closing_cash", label: "Closing Cash" },
    ];

    const latest = registers[0];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cash Register</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Daily cash balance calculation</p>
                </div>
                <button onClick={handleCalculate} disabled={calculating} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    {calculating ? "Calculating..." : "🔄 Calculate Today"}
                </button>
            </div>

            {message && <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-sm">{message}</div>}

            {/* Formula Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-sm text-blue-800 dark:text-blue-300">
                <strong>Formula:</strong> Opening Cash + Down Payments + Installments Received + Cash from Recovery Officers + Cash from Delivery Officers – Expenses = Closing Cash
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
            ) : (
                <>
                    {/* Today's summary */}
                    {latest && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6 mb-6">
                            <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                Latest Register — {new Date(latest.date).toLocaleDateString()}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {fields.map(f => (
                                    <div key={f.key} className={`rounded-lg p-4 ${f.key === "closing_cash" ? "bg-green-50 dark:bg-green-900/20 col-span-2 sm:col-span-1" : "bg-gray-50 dark:bg-gray-700"}`}>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
                                        <p className={`text-lg font-bold mt-1 ${f.key === "closing_cash" ? "text-green-700 dark:text-green-400" : f.key === "expenses" ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-white"}`}>
                                            PKR {((latest as any)[f.key] || 0).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* History */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-semibold text-gray-700 dark:text-gray-300">Register History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="bg-gray-50 dark:bg-gray-700 text-left">
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Date</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Opening</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Installments</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Expenses</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Closing</th>
                                </tr></thead>
                                <tbody>
                                    {registers.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-10 text-gray-500">No register entries yet. Click Calculate Today to create one.</td></tr>
                                    ) : registers.map((r) => (
                                        <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                            <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{new Date(r.date).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-gray-700 dark:text-gray-300">PKR {r.opening_cash.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-gray-700 dark:text-gray-300">PKR {r.installments_received.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-red-600 dark:text-red-400">PKR {r.expenses.toLocaleString()}</td>
                                            <td className="px-5 py-3 font-bold text-green-700 dark:text-green-400">PKR {r.closing_cash.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
