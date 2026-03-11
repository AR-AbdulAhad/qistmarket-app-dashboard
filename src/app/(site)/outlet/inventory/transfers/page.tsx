"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type InventoryItem = { id: number; product_name: string; imei_serial: string; status: string; };

export default function StockTransfersPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ inventory_id: "", to_type: "Outlet", to_id: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(""); const [success, setSuccess] = useState("");

    useEffect(() => { fetchInventory(); }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/inventory`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setInventory(data.inventory.filter((i: InventoryItem) => i.status === "In Stock"));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setError(""); setSuccess("");
        try {
            const res = await fetch(`${API_BASE}/api/outlet/inventory/transfer`, {
                method: "POST", headers: getAuthHeaders(),
                body: JSON.stringify({ inventory_id: parseInt(form.inventory_id), to_type: form.to_type, to_id: parseInt(form.to_id) }),
            });
            const data = await res.json();
            if (data.success) { setSuccess("Stock transferred successfully!"); setForm({ inventory_id: "", to_type: "Outlet", to_id: "" }); fetchInventory(); }
            else setError(data.message || "Failed.");
        } catch { setError("Network error."); } finally { setSaving(false); }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Stock Transfers</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Transfer stock between outlets, warehouse, or delivery officers</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
                {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                {success && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Item (In Stock) *</label>
                        <select value={form.inventory_id} onChange={e => setForm({ ...form, inventory_id: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                            <option value="">Select item...</option>
                            {inventory.map(item => (
                                <option key={item.id} value={item.id}>{item.product_name} — {item.imei_serial}</option>
                            ))}
                        </select>
                        {!loading && inventory.length === 0 && <p className="text-sm text-gray-400 mt-1">No in-stock items available for transfer.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transfer To *</label>
                        <select value={form.to_type} onChange={e => setForm({ ...form, to_type: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                            <option value="Outlet">Outlet</option>
                            <option value="Warehouse">Warehouse</option>
                            <option value="DeliveryOfficer">Delivery Officer</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination ID *</label>
                        <input type="number" value={form.to_id} onChange={e => setForm({ ...form, to_id: e.target.value })} placeholder={`Enter the ${form.to_type} ID`} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                        <p className="text-xs text-gray-400 mt-1">Enter the ID of the destination {form.to_type.toLowerCase()}.</p>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300">
                        ⚠️ All stock transfers are logged and recorded permanently.
                    </div>

                    <button type="submit" disabled={saving || !form.inventory_id || !form.to_id} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium">
                        {saving ? "Transferring..." : "Transfer Stock"}
                    </button>
                </form>
            </div>
        </div>
    );
}
