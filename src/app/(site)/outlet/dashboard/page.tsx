"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const getAuthHeaders = () => {
    const token = Cookies.get("auth_token");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

type Stats = {
    orders: {
        todayOrders: number;
        pendingVerification: number;
        approvedOrders: number;
        rejectedOrders: number;
        deliveryPending: number;
    };
    performance: {
        dailySales: number;
        weeklySales: number;
        monthlySales: number;
    };
    financials: {
        down_payments: number;
        installments_received: number;
        cash_from_recovery: number;
        cash_from_delivery: number;
        expenses: number;
        closing_cash: number;
    };
};

export default function OutletDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [outletName, setOutletName] = useState("");

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            const parsed = JSON.parse(user);
            setOutletName(parsed.outlet_name || "Outlet Portal");
        }
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/outlet/dashboard-stats`, {
                headers: getAuthHeaders(),
            });
            const data = await res.json();
            if (data.success) setStats(data.stats);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const cards = [
        { label: "Today's Orders", value: stats?.orders.todayOrders ?? 0, color: "bg-blue-500" },
        { label: "Pending Verification", value: stats?.orders.pendingVerification ?? 0, color: "bg-yellow-500" },
        { label: "Approved Orders", value: stats?.orders.approvedOrders ?? 0, color: "bg-green-500" },
        { label: "Rejected Orders", value: stats?.orders.rejectedOrders ?? 0, color: "bg-red-500" },
        { label: "Delivery Pending", value: stats?.orders.deliveryPending ?? 0, color: "bg-purple-500" },
    ];

    const performanceCards = [
        { label: "Daily Sale", value: stats?.performance.dailySales ?? 0 },
        { label: "Weekly Sale", value: stats?.performance.weeklySales ?? 0 },
        { label: "Monthly Sale", value: stats?.performance.monthlySales ?? 0 },
    ];

    const financialRows = [
        { label: "Down Payments", value: stats?.financials.down_payments ?? 0 },
        { label: "Installments Received", value: stats?.financials.installments_received ?? 0 },
        { label: "Cash from Recovery Officers", value: stats?.financials.cash_from_recovery ?? 0 },
        { label: "Cash from Delivery Officers", value: stats?.financials.cash_from_delivery ?? 0 },
        { label: "Expenses", value: stats?.financials.expenses ?? 0 },
        { label: "Cash Balance (Closing)", value: stats?.financials.closing_cash ?? 0, highlight: true },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{outletName} — Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Sales overview and performance metrics</p>
            </div>

            {/* Sales Overview */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Sales Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {cards.map((card) => (
                        <div key={card.label} className={`${card.color} text-white rounded-xl p-4 shadow`}>
                            <p className="text-3xl font-bold">{card.value}</p>
                            <p className="text-sm mt-1 opacity-90">{card.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Performance Metrics */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {performanceCards.map((c) => (
                        <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow border border-gray-100 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{c.label}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">PKR {c.value.toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Financial Overview */}
            <section>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Financial Overview</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Item</th>
                                <th className="text-right px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financialRows.map((row) => (
                                <tr key={row.label} className={`border-t border-gray-100 dark:border-gray-700 ${row.highlight ? "bg-green-50 dark:bg-green-900/20" : ""}`}>
                                    <td className={`px-5 py-3 ${row.highlight ? "font-bold text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>{row.label}</td>
                                    <td className={`px-5 py-3 text-right ${row.highlight ? "font-bold text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>PKR {row.value.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
