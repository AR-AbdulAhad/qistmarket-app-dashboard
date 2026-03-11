"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type InventoryItem = {
    id: number;
    product_name: string;
    category: string;
    imei_serial: string;
    purchase_price: number;
    installment_price: number;
    status: string;
};

const STATUS_COLORS: Record<string, string> = {
    "In Stock": "bg-green-100 text-green-700",
    "Sold": "bg-blue-100 text-blue-700",
    "Out of Stock": "bg-red-100 text-red-700",
    "Transferred": "bg-yellow-100 text-yellow-700",
};

export default function OutletInventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => { fetchInventory(); }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/inventory`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setInventory(data.inventory);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = inventory.filter(
        (item) =>
            item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
            item.imei_serial?.toLowerCase().includes(search.toLowerCase()) ||
            item.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventory Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your outlet stock</p>
                </div>
                <Link href="/outlet/inventory/add" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    + Add Stock
                </Link>
            </div>

            <div className="flex gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Search by product, IMEI, or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm flex-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                />
            </div>

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
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Product</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Category</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">IMEI / Serial</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Purchase Price</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Installment Price</th>
                                    <th className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">No inventory found.</td>
                                    </tr>
                                ) : filtered.map((item, i) => (
                                    <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{i + 1}</td>
                                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{item.product_name}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{item.category || "—"}</td>
                                        <td className="px-5 py-3 font-mono text-gray-700 dark:text-gray-300">{item.imei_serial}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">PKR {item.purchase_price.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">PKR {item.installment_price.toLocaleString()}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-700"}`}>
                                                {item.status}
                                            </span>
                                        </td>
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
