"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import {
    Edit, Trash2, Search, CheckSquare, Square, Package,
    AlertCircle, RefreshCw, ChevronDown, ChevronRight, Save, X
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type InventoryItem = {
    id: number;
    product_name: string;
    category: string;
    imei_serial?: string;
    color_variant?: string;
    quantity: number;
    purchase_price: number;
    installment_price: number;
    status: string;
};

// A "group" is formed by unique (product_name + color_variant).
// For IMEI-based items (qty=1 each), they are children.
// For bulk generic items (qty>1), they are standalone but also grouped.
type GroupedItem = {
    key: string;          // product_name + || + color_variant
    product_name: string;
    category: string;
    color_variant?: string;
    purchase_price: number;
    totalQty: number;     // sum of all child quantities
    inStockQty: number;
    children: InventoryItem[];
};

const STATUS_COLORS: Record<string, string> = {
    "In Stock": "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    "Sold": "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    "Out Of Stock": "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

export default function OutletInventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Expanded group keys
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    // Alert
    const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Selected individual IDs (for bulk actions)
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});

    useEffect(() => { fetchInventory(); }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/inventory`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                setInventory(data.inventory);
                setSelectedIds([]);
            }
        } catch {
            showAlert("error", "Network error fetching inventory.");
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type: "success" | "error", message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3500);
    };

    // Group items by product_name + color_variant
    const grouped = useMemo<GroupedItem[]>(() => {
        const filtered = inventory.filter(item =>
            item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
            item.imei_serial?.toLowerCase().includes(search.toLowerCase()) ||
            item.category?.toLowerCase().includes(search.toLowerCase()) ||
            item.color_variant?.toLowerCase().includes(search.toLowerCase())
        );

        const map = new Map<string, GroupedItem>();
        for (const item of filtered) {
            const key = `${item.product_name}||${item.color_variant || ""}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    product_name: item.product_name,
                    category: item.category,
                    color_variant: item.color_variant,
                    purchase_price: item.purchase_price,
                    totalQty: 0,
                    inStockQty: 0,
                    children: [],
                });
            }
            const grp = map.get(key)!;
            grp.totalQty += item.quantity;
            if (item.status === "In Stock") grp.inStockQty += item.quantity;
            grp.children.push(item);
        }
        return Array.from(map.values());
    }, [inventory, search]);

    const toggleExpand = (key: string) => {
        setExpandedKeys(prev => {
            const n = new Set(prev);
            n.has(key) ? n.delete(key) : n.add(key);
            return n;
        });
    };

    const toggleChildSelection = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleGroupSelection = (grp: GroupedItem) => {
        const ids = grp.children.map(c => c.id);
        const allSelected = ids.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...ids])]);
        }
    };

    // Quick Status Toggle (Inline)
    const toggleStatus = async (item: InventoryItem) => {
        const newStatus = item.status === "In Stock" ? "Out Of Stock" : "In Stock";
        const res = await fetch(`${API_BASE}/api/outlet/inventory/${item.id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (data.success) {
            setInventory(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
            showAlert("success", `${item.product_name} marked ${newStatus}`);
        } else {
            showAlert("error", "Failed to update status.");
        }
    };

    const startEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setEditForm({
            product_name: item.product_name,
            category: item.category,
            imei_serial: item.imei_serial,
            color_variant: item.color_variant,
            quantity: item.quantity,
            purchase_price: item.purchase_price,
            status: item.status,
        });
    };

    const saveEdit = async (id: number) => {
        const res = await fetch(`${API_BASE}/api/outlet/inventory/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(editForm),
        });
        const data = await res.json();
        if (data.success) {
            setInventory(prev => prev.map(i => i.id === id ? { ...i, ...editForm } as InventoryItem : i));
            setEditingId(null);
            showAlert("success", "Item updated.");
        } else {
            showAlert("error", "Update failed.");
        }
    };

    const deleteItem = async (id: number) => {
        if (!confirm("Delete this inventory record?")) return;
        const res = await fetch(`${API_BASE}/api/outlet/inventory/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success) {
            setInventory(prev => prev.filter(i => i.id !== id));
            showAlert("success", "Item deleted.");
        } else {
            showAlert("error", "Could not delete item.");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Delete ${selectedIds.length} item(s)?`)) return;
        const res = await fetch(`${API_BASE}/api/outlet/inventory/bulk-delete`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids: selectedIds }),
        });
        const data = await res.json();
        if (data.success) {
            setInventory(prev => prev.filter(i => !selectedIds.includes(i.id)));
            setSelectedIds([]);
            showAlert("success", `${data.count} items deleted.`);
        } else {
            showAlert("error", "Bulk delete failed.");
        }
    };

    const handleBulkStatusChange = async (targetStatus: string) => {
        if (selectedIds.length === 0) return;
        const res = await fetch(`${API_BASE}/api/outlet/inventory/bulk-edit`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids: selectedIds, data: { status: targetStatus } }),
        });
        const data = await res.json();
        if (data.success) {
            setInventory(prev => prev.map(i => selectedIds.includes(i.id) ? { ...i, status: targetStatus } : i));
            setSelectedIds([]);
            showAlert("success", `${data.count} items → ${targetStatus}`);
        } else {
            showAlert("error", "Bulk status update failed.");
        }
    };

    // Overall stats
    const totalItems = inventory.reduce((s, i) => s + i.quantity, 0);
    const totalInStock = inventory.filter(i => i.status === "In Stock").reduce((s, i) => s + i.quantity, 0);
    const totalSold = inventory.filter(i => i.status === "Sold").reduce((s, i) => s + i.quantity, 0);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto relative">
            <Breadcrumb pageName="Outlet Inventory" />

            {/* Floating Alert */}
            {alert && (
                <div className={`fixed top-4 right-4 z-[99] px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 animate-fadeIn ${
                    alert.type === "success"
                    ? "bg-white border-green-200 text-green-700 dark:bg-boxdark dark:border-green-900/50"
                    : "bg-white border-red-200 text-red-700 dark:bg-boxdark dark:border-red-900/50"
                }`}>
                    {alert.type === "success" ? <CheckSquare size={20} /> : <AlertCircle size={20} />}
                    <span className="font-semibold text-sm">{alert.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Package size={24} className="text-primary" /> Stock Inventory
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Grouped by product & variant — expand to manage individual units.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchInventory} className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-meta-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <Link href="/outlet/inventory/add" className="bg-primary hover:bg-opacity-90 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-opacity">
                        + Add Stock
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total Stock", val: totalItems, color: "text-primary" },
                    { label: "In Stock", val: totalInStock, color: "text-green-600 dark:text-green-400" },
                    { label: "Sold", val: totalSold, color: "text-blue-600 dark:text-blue-400" },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl p-4 shadow-sm text-center">
                        <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm border border-stroke dark:border-strokedark p-4 mb-4 flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="relative w-full lg:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, IMEI, category, variant..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-stroke dark:border-strokedark rounded-lg pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-form-input focus:border-primary outline-none dark:text-white"
                    />
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap p-2 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="text-xs font-bold px-2 text-primary">{selectedIds.length} selected</span>
                        <div className="h-4 w-px bg-primary/30" />
                        <button onClick={() => handleBulkStatusChange("In Stock")} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs font-bold">Mark In-Stock</button>
                        <button onClick={() => handleBulkStatusChange("Out Of Stock")} className="px-3 py-1.5 bg-gray-200 text-gray-700 dark:bg-meta-4 dark:text-gray-300 rounded-md text-xs font-bold">Mark Out-of-Stock</button>
                        <button onClick={() => handleBulkStatusChange("Sold")} className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs font-bold">Mark Sold</button>
                        <button onClick={handleBulkDelete} className="ml-2 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1 rounded-md text-xs font-bold">
                            <Trash2 size={13} /> Delete
                        </button>
                        <button onClick={() => setSelectedIds([])} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 rounded-md text-xs">Clear</button>
                    </div>
                )}
            </div>

            {/* Inventory Grouped Table */}
            <div className="bg-white dark:bg-boxdark rounded-xl shadow border border-stroke dark:border-strokedark overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
                        <p className="text-sm font-medium">Loading inventory...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 font-semibold uppercase text-xs tracking-wider">
                                    <th className="px-4 py-4 w-10" />
                                    <th className="px-4 py-4 w-10 text-center">#</th>
                                    <th className="px-4 py-4">Product</th>
                                    <th className="px-4 py-4">Category</th>
                                    <th className="px-4 py-4">Variant / Color</th>
                                    <th className="px-4 py-4 text-center">Total Qty</th>
                                    <th className="px-4 py-4 text-center">In Stock</th>
                                    <th className="px-4 py-4">Base Price</th>
                                    <th className="px-4 py-4 text-center w-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grouped.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-16 text-gray-500 font-medium">
                                            No inventory found. Try a different search or add stock.
                                        </td>
                                    </tr>
                                ) : grouped.map((grp) => {
                                    const isExpanded = expandedKeys.has(grp.key);
                                    const groupIds = grp.children.map(c => c.id);
                                    const allSelected = groupIds.every(id => selectedIds.includes(id));
                                    const someSelected = groupIds.some(id => selectedIds.includes(id));

                                    return (
                                        <Fragment key={grp.key}>
                                            {/* ── GROUP (MASTER) ROW ── */}
                                            <tr
                                                key={`grp-${grp.key}`}
                                                className={`border-b border-stroke dark:border-strokedark cursor-pointer transition-colors ${
                                                    isExpanded ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-gray-50 dark:hover:bg-meta-4/20"
                                                }`}
                                            >
                                                {/* Expand toggle */}
                                                <td className="px-4 py-4 text-center" onClick={() => toggleExpand(grp.key)}>
                                                    {isExpanded
                                                        ? <ChevronDown size={18} className="text-primary mx-auto" />
                                                        : <ChevronRight size={18} className="text-gray-400 mx-auto" />
                                                    }
                                                </td>

                                                {/* Group select checkbox */}
                                                <td className="px-4 py-4 text-center" onClick={() => toggleGroupSelection(grp)}>
                                                    {allSelected
                                                        ? <CheckSquare size={18} className="text-primary mx-auto" />
                                                        : someSelected
                                                        ? <div className="w-[18px] h-[18px] border-2 border-primary bg-primary/30 rounded mx-auto" />
                                                        : <Square size={18} className="text-gray-400 mx-auto" />
                                                    }
                                                </td>

                                                <td className="px-4 py-4" onClick={() => toggleExpand(grp.key)}>
                                                    <span className="font-bold text-black dark:text-white">{grp.product_name}</span>
                                                </td>
                                                <td className="px-4 py-4 text-gray-500 dark:text-gray-400" onClick={() => toggleExpand(grp.key)}>
                                                    {grp.category || "—"}
                                                </td>
                                                <td className="px-4 py-4" onClick={() => toggleExpand(grp.key)}>
                                                    {grp.color_variant
                                                        ? <span className="px-2 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 rounded-full text-xs font-medium border border-violet-200 dark:border-violet-700">{grp.color_variant}</span>
                                                        : <span className="text-gray-400">—</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-4 text-center font-black text-lg" onClick={() => toggleExpand(grp.key)}>
                                                    {grp.totalQty}
                                                </td>
                                                <td className="px-4 py-4 text-center" onClick={() => toggleExpand(grp.key)}>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        grp.inStockQty > 0
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                                            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                                    }`}>
                                                        {grp.inStockQty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4" onClick={() => toggleExpand(grp.key)}>
                                                    <span className="font-medium text-gray-700 dark:text-gray-200">PKR {grp.purchase_price?.toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => toggleExpand(grp.key)}
                                                        className="text-xs text-primary font-semibold hover:underline"
                                                    >
                                                        {isExpanded ? "Collapse" : `${grp.children.length} unit${grp.children.length > 1 ? "s" : ""}`}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* ── CHILD (DETAIL) ROWS ── shown when expanded */}
                                            {isExpanded && grp.children.map((item, idx) => {
                                                const isEditing = editingId === item.id;
                                                const isChildSelected = selectedIds.includes(item.id);

                                                return (
                                                    <tr
                                                        key={`child-${item.id}`}
                                                        className={`border-b border-dashed border-stroke/50 dark:border-strokedark/50 text-sm ${
                                                            isChildSelected ? "bg-primary/5 dark:bg-primary/10" : "bg-gray-50/50 dark:bg-meta-4/10"
                                                        } ${isEditing ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}`}
                                                    >
                                                        {/* Indent arrow */}
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center">
                                                                <div className="w-4 h-px bg-gray-300 dark:bg-gray-600 mt-2.5 mr-1" />
                                                                <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                                                            </div>
                                                        </td>

                                                        {/* Child checkbox */}
                                                        <td className="px-4 py-3 text-center">
                                                            <button onClick={() => toggleChildSelection(item.id)}>
                                                                {isChildSelected
                                                                    ? <CheckSquare size={16} className="text-primary mx-auto" />
                                                                    : <Square size={16} className="text-gray-400 mx-auto" />
                                                                }
                                                            </button>
                                                        </td>

                                                        {/* Product (editable) */}
                                                        <td className="px-4 py-3" colSpan={isEditing ? 1 : 1}>
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.product_name || ""}
                                                                    onChange={e => setEditForm({ ...editForm, product_name: e.target.value })}
                                                                    className="w-full border rounded px-2 py-1 text-xs dark:bg-form-input dark:border-strokedark outline-none"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-600 dark:text-gray-300 text-xs pl-2">
                                                                    {item.imei_serial
                                                                        ? <span className="font-mono bg-gray-100 dark:bg-meta-4 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-strokedark">{item.imei_serial}</span>
                                                                        : <span className="text-gray-400 italic text-xs">Generic Batch</span>
                                                                    }
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Category */}
                                                        <td className="px-4 py-3">
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.category || ""}
                                                                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                                                    className="w-full border rounded px-2 py-1 text-xs dark:bg-form-input dark:border-strokedark outline-none"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-500 dark:text-gray-400 text-xs">{item.category || "—"}</span>
                                                            )}
                                                        </td>

                                                        {/* Variant */}
                                                        <td className="px-4 py-3">
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.color_variant || ""}
                                                                    onChange={e => setEditForm({ ...editForm, color_variant: e.target.value })}
                                                                    className="w-32 border rounded px-2 py-1 text-xs dark:bg-form-input dark:border-strokedark outline-none"
                                                                    placeholder="Color/Variant"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-500 dark:text-gray-400 text-xs">{item.color_variant || "—"}</span>
                                                            )}
                                                        </td>

                                                        {/* Quantity */}
                                                        <td className="px-4 py-3 text-center">
                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={editForm.quantity || 1}
                                                                    onChange={e => {
                                                                        const base = { ...editForm, quantity: parseInt(e.target.value) || 1 };
                                                                        if (base.quantity > 1) base.imei_serial = "";
                                                                        setEditForm(base);
                                                                    }}
                                                                    disabled={(editForm.imei_serial || "").trim().length > 0}
                                                                    className="w-16 text-center border rounded px-1 py-1 text-xs disabled:opacity-50 dark:bg-form-input dark:border-strokedark outline-none mx-auto"
                                                                />
                                                            ) : (
                                                                <span className="font-bold">{item.quantity}</span>
                                                            )}
                                                        </td>

                                                        {/* In-Stock count (same as qty for child row) */}
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-600"}`}>
                                                                {item.status === "In Stock" ? item.quantity : 0}
                                                            </span>
                                                        </td>

                                                        {/* Purchase Price */}
                                                        <td className="px-4 py-3">
                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    value={editForm.purchase_price || 0}
                                                                    onChange={e => setEditForm({ ...editForm, purchase_price: parseFloat(e.target.value) })}
                                                                    className="w-full border rounded px-2 py-1 text-xs dark:bg-form-input dark:border-strokedark outline-none"
                                                                />
                                                            ) : (
                                                                <span className="text-xs text-gray-600 dark:text-gray-300">PKR {item.purchase_price?.toLocaleString()}</span>
                                                            )}
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-4 py-3 text-center">
                                                            {isEditing ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button onClick={() => saveEdit(item.id)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                                                                        <Save size={14} />
                                                                    </button>
                                                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4 rounded">
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    {/* Status button */}
                                                                    <button
                                                                        onClick={() => toggleStatus(item)}
                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold hover:scale-105 transition-transform ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-600"}`}
                                                                    >
                                                                        {item.status}
                                                                    </button>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-primary transition-colors">
                                                                            <Edit size={14} />
                                                                        </button>
                                                                        <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-danger transition-colors">
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer Summary */}
            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                {grouped.length} product group{grouped.length !== 1 ? "s" : ""} · {inventory.length} total unit records
            </div>
        </div>
    );
}
