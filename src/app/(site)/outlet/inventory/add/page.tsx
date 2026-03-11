"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

export default function AddInventoryPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        product_name: "",
        category: "",
        imei_serial: "",
        purchase_price: "",
        installment_price: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.product_name || !form.imei_serial || !form.purchase_price || !form.installment_price) {
            setError("Please fill all required fields.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/inventory`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...form,
                    purchase_price: parseFloat(form.purchase_price),
                    installment_price: parseFloat(form.installment_price),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess("Item added to inventory successfully!");
                setTimeout(() => router.push("/outlet/inventory"), 1500);
            } else {
                setError(data.message || "Failed to add item.");
            }
        } catch (e) {
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    };

    const categories = ["Smartphone", "Tablet", "Laptop", "Accessories", "Other"];

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Add Inventory Stock</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Add a new product to your outlet's inventory</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
                {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm">{error}</div>}
                {success && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                        <input name="product_name" value={form.product_name} onChange={handleChange} placeholder="e.g. Samsung Galaxy A54" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select name="category" value={form.category} onChange={handleChange} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IMEI / Serial Number *</label>
                        <input name="imei_serial" value={form.imei_serial} onChange={handleChange} placeholder="Enter IMEI or Serial Number" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price (PKR) *</label>
                            <input name="purchase_price" type="number" value={form.purchase_price} onChange={handleChange} placeholder="0" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Installment Price (PKR) *</label>
                            <input name="installment_price" type="number" value={form.installment_price} onChange={handleChange} placeholder="0" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-medium">
                            {loading ? "Saving..." : "Add to Inventory"}
                        </button>
                        <button type="button" onClick={() => router.back()} className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
