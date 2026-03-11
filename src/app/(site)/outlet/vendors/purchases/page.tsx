"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type Purchase = {
    id: number;
    vendor_name: string;
    product_name: string;
    imei_serial: string;
    quantity: number;
    purchase_price: number;
    purchase_date: string;
};

export default function VendorPurchasesPage() {
    const router = useRouter();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ vendor_name: "", product_name: "", imei_serial: "", quantity: "1", purchase_price: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => { fetchPurchases(); }, []);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/vendors/purchases`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setPurchases(data.purchases);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(""); setSuccess("");
        try {
            const res = await fetch(`${API_BASE}/api/outlet/vendors/purchases`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...form, quantity: parseInt(form.quantity), purchase_price: parseFloat(form.purchase_price) }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess("Purchase recorded and inventory updated!");
                setForm({ vendor_name: "", product_name: "", imei_serial: "", quantity: "1", purchase_price: "" });
                setShowForm(false);
                fetchPurchases();
            } else { setError(data.message || "Failed."); }
        } catch { setError("Network error."); } finally { setSaving(false); }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Vendor Purchases</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Record product purchases from vendors</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    {showForm ? "Cancel" : "+ Record Purchase"}
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6 mb-6">
                    {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                    {success && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { name: "vendor_name", label: "Vendor Name *", placeholder: "Vendor name" },
                            { name: "product_name", label: "Product Name *", placeholder: "Product name" },
                            { name: "imei_serial", label: "IMEI / Serial *", placeholder: "IMEI or serial number" },
                            { name: "quantity", label: "Quantity", placeholder: "1", type: "number" },
                            { name: "purchase_price", label: "Purchase Price (PKR) *", placeholder: "0", type: "number" },
                        ].map((f) => (
                            <div key={f.name}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                                <input name={f.name} type={f.type || "text"} placeholder={f.placeholder} value={(form as any)[f.name]}
                                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                            </div>
                        ))}
                        <div className="sm:col-span-2">
                            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-medium">
                                {saving ? "Saving..." : "Record Purchase"}
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
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 text-left">
                                    {["#", "Vendor", "Product", "IMEI/Serial", "Qty", "Price", "Date"].map(h => (
                                        <th key={h} className="px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">No purchases recorded.</td></tr>
                                ) : purchases.map((p, i) => (
                                    <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{i + 1}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{p.vendor_name}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{p.product_name}</td>
                                        <td className="px-5 py-3 font-mono text-gray-700 dark:text-gray-300">{p.imei_serial}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{p.quantity}</td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300">PKR {p.purchase_price.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{new Date(p.purchase_date).toLocaleDateString()}</td>
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
