"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

const STATUS_COLORS: Record<string, string> = {
    new: "bg-gray-100 text-gray-700",
    pending: "bg-yellow-100 text-yellow-700",
    "Pending Verification": "bg-yellow-100 text-yellow-700",
    "Under Verification": "bg-blue-100 text-blue-700",
    "Pending Analysis": "bg-orange-100 text-orange-700",
    Approved: "bg-green-100 text-green-700",
    "Ready for Delivery": "bg-purple-100 text-purple-700",
    Delivered: "bg-teal-100 text-teal-700",
    Rejected: "bg-red-100 text-red-700",
    cancelled: "bg-red-100 text-red-700",
};

type Order = {
    id: number;
    order_ref: string;
    customer_name: string;
    whatsapp_number: string;
    product_name: string;
    total_amount: number;
    status: string;
    created_at: string;
};

export default function OutletOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "15" });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter) params.set("status", statusFilter);
        try {
            const res = await fetch(`${API_BASE}/api/orders?${params}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                setOrders(data.data.orders);
                setTotalPages(data.data.pagination.totalPages);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const statuses = ["Pending Verification", "Under Verification", "Pending Analysis", "Approved", "Ready for Delivery", "Delivered", "Rejected"];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Outlet Orders</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage orders assigned to your outlet</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Search orders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm flex-1 min-w-[200px] bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                >
                    <option value="">All Statuses</option>
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                    onClick={fetchOrders}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                    Search
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 text-left">
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">#</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Order Ref</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Customer</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">WhatsApp</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Product</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Amount</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Status</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-10 text-gray-500 dark:text-gray-400">No orders found.</td>
                                    </tr>
                                ) : orders.map((o, i) => (
                                    <tr key={o.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{(page - 1) * 15 + i + 1}</td>
                                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{o.order_ref}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{o.customer_name}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{o.whatsapp_number}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{o.product_name}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">PKR {o.total_amount.toLocaleString()}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"}`}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 dark:border-gray-600 dark:text-gray-300">
                        Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 dark:border-gray-600 dark:text-gray-300">
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
