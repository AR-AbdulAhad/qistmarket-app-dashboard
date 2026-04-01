"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type HandoverRecord = {
    id: number;
    from_id: number;
    to_id: number;
    inventory_id: number;
    created_at: string;
    inventory: {
        imei_serial: string;
        product_name: string;
    };
    order: {
        imei_serial: string;
        customer_name: string;
        order_ref: string;
        delivery_officer: {
            full_name: string;
        };
    } | null;
};

export default function HandoverHistoryPage() {
    const [history, setHistory] = useState<HandoverRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/orders/handover/history`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                setHistory(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Handover History</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Full log of all products handed over to delivery officers</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No history found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Handover records will appear here once you complete a delivery pickup.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-600">
                                    <th className="px-6 py-4 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">Order Ref</th>
                                    <th className="px-6 py-4 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">Product / IMEI</th>
                                    <th className="px-6 py-4 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">Recipient (DO)</th>
                                    <th className="px-6 py-4 text-center font-bold uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(item.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-primary">{item.order?.order_ref || "N/A"}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800 dark:text-gray-200">
                                                {item.order?.customer_name || "Unknown"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800 dark:text-gray-200">
                                                {item.inventory.product_name}
                                            </div>
                                            <div className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded inline-block mt-1">
                                                {item.inventory.imei_serial}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                                                    {item.order?.delivery_officer.full_name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                    {item.order?.delivery_officer.full_name || "Agent"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 uppercase">
                                                SUCCESS
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
