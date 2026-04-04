"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Send, KeyRound, CheckCircle2, ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

interface InventoryItem {
    id: number;
    product_name: string;
    category: string;
    imei_serial?: string;
    color_variant?: string;
    quantity: number;
    status: string;
}

interface GroupedItem {
    key: string;
    product_name: string;
    category: string;
    color_variant?: string;
    totalQty: number;
    children: InventoryItem[];
}

interface DeliveryOfficer { id: number; full_name: string; username: string; }
interface Outlet { id: number; name: string; }

export default function TransfersPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [officers, setOfficers] = useState<DeliveryOfficer[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);

    // Per-item selected IDs and transfer quantities
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [transferQuantities, setTransferQuantities] = useState<{ [id: number]: number }>({});

    // Expanded group keys
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    // Transfer Target
    const [transferType, setTransferType] = useState<"Delivery Officer" | "Outlet">("Delivery Officer");
    const [selectedTargetId, setSelectedTargetId] = useState("");

    // OTP Modal
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

    const fetchData = async () => {
        try {
            const [invRes, offRes, outRes] = await Promise.all([
                fetch(`${API_BASE}/api/outlet/inventory`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/api/orders/outlet/officers`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/api/outlets`, { headers: getAuthHeaders() }),
            ]);
            const [invData, offData, outData] = await Promise.all([invRes.json(), offRes.json(), outRes.json()]);
            if (invData.success) setInventory(invData.inventory || []);
            if (offData.success) setOfficers(offData.data || []);
            // Outlets API returns { success: true, outlets: [...] }
            if (outData.success) setOutlets(outData.outlets || outData.data || []);
        } catch (e) {
            console.error("Error fetching data", e);
        }
    };

    useEffect(() => {
        fetchData();
        setSelectedTargetId("");
    }, [transferType]);

    // Only In-Stock items
    const inStockItems = useMemo(() => inventory.filter(i => i.status === "In Stock"), [inventory]);

    // Group in-stock items by product_name + color_variant
    const grouped = useMemo<GroupedItem[]>(() => {
        const map = new Map<string, GroupedItem>();
        for (const item of inStockItems) {
            const key = `${item.product_name}||${item.color_variant || ""}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    product_name: item.product_name,
                    category: item.category,
                    color_variant: item.color_variant,
                    totalQty: 0,
                    children: [],
                });
            }
            const grp = map.get(key)!;
            grp.totalQty += item.quantity;
            grp.children.push(item);
        }
        return Array.from(map.values());
    }, [inStockItems]);

    const toggleExpand = (key: string) => {
        setExpandedKeys(prev => {
            const n = new Set(prev);
            n.has(key) ? n.delete(key) : n.add(key);
            return n;
        });
    };

    // When selecting a child item, also auto-open group
    const toggleChild = (item: InventoryItem, grpKey: string) => {
        const isSelected = selectedIds.includes(item.id);
        if (isSelected) {
            setSelectedIds(prev => prev.filter(id => id !== item.id));
            setTransferQuantities(prev => { const n = { ...prev }; delete n[item.id]; return n; });
        } else {
            setSelectedIds(prev => [...prev, item.id]);
            setTransferQuantities(prev => ({ ...prev, [item.id]: 1 }));
            setExpandedKeys(prev => new Set([...prev, grpKey]));
        }
    };

    // Select/deselect entire group — auto-expands the group
    const toggleGroup = (grp: GroupedItem) => {
        const ids = grp.children.map(c => c.id);
        const allSelected = ids.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
            setTransferQuantities(prev => {
                const n = { ...prev };
                ids.forEach(id => delete n[id]);
                return n;
            });
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...ids])]);
            const newQtys: { [k: number]: number } = {};
            grp.children.forEach(c => newQtys[c.id] = 1);
            setTransferQuantities(prev => ({ ...prev, ...newQtys }));
            setExpandedKeys(prev => new Set([...prev, grp.key]));
        }
    };

    const updateQty = (id: number, val: number, max: number) => {
        let v = Math.max(1, Math.min(max, val || 1));
        setTransferQuantities(prev => ({ ...prev, [id]: v }));
        if (!selectedIds.includes(id)) {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const initiateTransfer = async () => {
        if (selectedIds.length === 0 || !selectedTargetId) return;
        setLoading(true);
        setStatusMessage({ type: "", text: "" });
        try {
            const payloadArray = selectedIds.map(id => ({ id, quantity: transferQuantities[id] || 1 }));
            const res = await fetch(`${API_BASE}/api/outlet/inventory/transfer/initiate`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ inventory_ids: payloadArray, to_type: transferType, to_id: selectedTargetId }),
            });
            const data = await res.json();
            if (data.success) {
                setOtpModalOpen(true);
                setOtp("");
                setStatusMessage({ type: "success", text: `OTP sent to ${transferType}.` });
            } else {
                setStatusMessage({ type: "error", text: data.message || "Failed to initiate." });
            }
        } catch {
            setStatusMessage({ type: "error", text: "Network error." });
        } finally {
            setLoading(false);
        }
    };

    const verifyTransfer = async () => {
        if (otp.length < 4) return;
        setLoading(true);
        try {
            const payloadArray = selectedIds.map(id => ({ id, quantity: transferQuantities[id] || 1 }));
            const res = await fetch(`${API_BASE}/api/outlet/inventory/transfer/verify`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ otp, inventory_ids: payloadArray, to_type: transferType, to_id: selectedTargetId }),
            });
            const data = await res.json();
            if (data.success) {
                setOtpModalOpen(false);
                setStatusMessage({ type: "success", text: "Transfer completed successfully." });
                setSelectedIds([]);
                setTransferQuantities({});
                setExpandedKeys(new Set());
                fetchData();
            } else {
                setStatusMessage({ type: "error", text: data.message || "OTP verification failed." });
            }
        } catch {
            setStatusMessage({ type: "error", text: "Network error." });
        } finally {
            setLoading(false);
        }
    };

    // Total units selected (considering qty)
    const totalUnitsSelected = selectedIds.reduce((sum, id) => sum + (transferQuantities[id] || 1), 0);

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Initiate Stock Transfer" />

            {statusMessage.text && (
                <div className={`mb-6 p-4 rounded-lg font-medium text-sm border flex items-center gap-3 ${
                    statusMessage.type === "success"
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                }`}>
                    {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : null}
                    {statusMessage.text}
                </div>
            )}

            <div className="bg-white dark:bg-boxdark rounded-xl shadow border border-stroke dark:border-strokedark p-6">
                {/* Destination Bar */}
                <div className="mb-8 pb-6 border-b border-stroke dark:border-strokedark flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Select Destination & Target</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Expand product groups below to pick specific units/IMEIs.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <select
                            value={transferType}
                            onChange={(e) => setTransferType(e.target.value as "Delivery Officer" | "Outlet")}
                            className="w-full sm:w-auto min-w-[200px] border border-stroke dark:border-strokedark rounded-lg px-4 py-2.5 text-sm bg-gray-50 outline-none focus:border-primary dark:bg-form-input dark:text-white"
                        >
                            <option value="Delivery Officer">Delivery Officer</option>
                            <option value="Outlet">General Outlet</option>
                        </select>
                        <select
                            value={selectedTargetId}
                            onChange={(e) => setSelectedTargetId(e.target.value)}
                            className="w-full sm:w-auto min-w-[250px] border border-stroke dark:border-strokedark rounded-lg px-4 py-2.5 text-sm bg-gray-50 outline-none focus:border-primary dark:bg-form-input dark:text-white"
                        >
                            <option value="">Select {transferType}</option>
                            {transferType === "Delivery Officer"
                                ? officers.map(off => <option key={off.id} value={off.id}>{off.full_name} ({off.username})</option>)
                                : outlets.map(out => <option key={out.id} value={out.id}>{out.name}</option>)
                            }
                        </select>
                    </div>
                </div>

                {/* Grouped Stock Selection Table */}
                <div className="overflow-x-auto mb-6 border rounded-xl border-stroke dark:border-strokedark">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="sticky top-0 bg-gray-100 dark:bg-meta-4 shadow-sm z-10">
                            <tr className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                <th className="p-4 w-10" />
                                <th className="p-4 w-10 text-center">Sel.</th>
                                <th className="p-4">Product</th>
                                <th className="p-4">Variant</th>
                                <th className="p-4 text-center">Available Qty</th>
                                <th className="p-4 text-center">Transfer Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stroke dark:divide-strokedark">
                            {grouped.length === 0 ? (
                                <tr><td colSpan={6} className="p-10 text-center text-gray-500">No in-stock items available for transfer.</td></tr>
                            ) : grouped.map(grp => {
                                const isExpanded = expandedKeys.has(grp.key);
                                const groupIds = grp.children.map(c => c.id);
                                const allSelected = groupIds.every(id => selectedIds.includes(id));
                                const someSelected = groupIds.some(id => selectedIds.includes(id));

                                return (
                                    <Fragment key={grp.key}>
                                        {/* Master Group Row */}
                                        <tr
                                            key={`grp-${grp.key}`}
                                            className={`cursor-pointer transition-colors ${isExpanded ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-gray-50 dark:hover:bg-meta-4/20"}`}
                                        >
                                            <td className="p-4 text-center" onClick={() => toggleExpand(grp.key)}>
                                                {isExpanded
                                                    ? <ChevronDown size={16} className="text-primary mx-auto" />
                                                    : <ChevronRight size={16} className="text-gray-400 mx-auto" />
                                                }
                                            </td>
                                            <td className="p-4 text-center" onClick={() => toggleGroup(grp)}>
                                                {allSelected
                                                    ? <CheckSquare size={18} className="text-primary mx-auto" />
                                                    : someSelected
                                                    ? <div className="w-[18px] h-[18px] border-2 border-primary bg-primary/30 rounded mx-auto" />
                                                    : <Square size={18} className="text-gray-400 mx-auto" />
                                                }
                                            </td>
                                            <td className="p-4 font-bold text-black dark:text-white" onClick={() => toggleExpand(grp.key)}>
                                                {grp.product_name}
                                                <span className="ml-2 text-xs text-gray-400 font-normal">({grp.children.length} unit{grp.children.length !== 1 ? "s" : ""})</span>
                                            </td>
                                            <td className="p-4 text-gray-500" onClick={() => toggleExpand(grp.key)}>
                                                {grp.color_variant
                                                    ? <span className="px-2 py-0.5 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 rounded-full text-xs border border-violet-200 dark:border-violet-700">{grp.color_variant}</span>
                                                    : <span className="text-gray-400 text-xs">{grp.category || "—"}</span>
                                                }
                                            </td>
                                            <td className="p-4 text-center font-black text-base" onClick={() => toggleExpand(grp.key)}>
                                                {grp.totalQty}
                                            </td>
                                            <td className="p-4 text-center text-xs text-gray-400">
                                                {someSelected ? (
                                                    <span className="font-bold text-primary">
                                                        {groupIds.filter(id => selectedIds.includes(id)).reduce((s, id) => s + (transferQuantities[id] || 1), 0)} selected
                                                    </span>
                                                ) : "—"}
                                            </td>
                                        </tr>

                                        {/* Child Unit Rows */}
                                        {isExpanded && grp.children.map((item, idx) => {
                                            const isSelected = selectedIds.includes(item.id);
                                            return (
                                                <tr
                                                    key={`child-${item.id}`}
                                                    className={`border-t border-dashed border-stroke/50 dark:border-strokedark/50 transition-colors ${
                                                        isSelected ? "bg-primary/5 dark:bg-primary/10" : "bg-gray-50/60 dark:bg-meta-4/10"
                                                    }`}
                                                >
                                                    <td className="p-3 pl-6 text-center">
                                                        <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                                                    </td>

                                                    {/* Checkbox */}
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => toggleChild(item, grp.key)}>
                                                            {isSelected
                                                                ? <CheckSquare size={16} className="text-primary mx-auto" />
                                                                : <Square size={16} className="text-gray-400 mx-auto" />
                                                            }
                                                        </button>
                                                    </td>

                                                    {/* IMEI / Generic label */}
                                                    <td className="p-3 pl-8">
                                                        {item.imei_serial
                                                            ? <span className="font-mono bg-gray-100 dark:bg-meta-4 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-strokedark text-gray-700 dark:text-gray-300">{item.imei_serial}</span>
                                                            : <span className="text-gray-400 text-xs italic">Generic Batch</span>
                                                        }
                                                    </td>

                                                    {/* Variant */}
                                                    <td className="p-3 text-gray-500 text-xs">{item.color_variant || item.category || "—"}</td>

                                                    {/* Available */}
                                                    <td className="p-3 text-center font-bold text-sm">{item.quantity}</td>

                                                    {/* Transfer Qty Input */}
                                                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.quantity}
                                                                value={isSelected ? (transferQuantities[item.id] || 1) : ""}
                                                                placeholder="—"
                                                                onChange={e => updateQty(item.id, parseInt(e.target.value), item.quantity)}
                                                                disabled={!isSelected}
                                                                className="w-16 text-center border rounded px-1 py-1 text-xs dark:bg-form-input dark:border-strokedark outline-none disabled:opacity-30"
                                                            />
                                                            {isSelected && item.quantity > 1 && (
                                                                <span className="text-[10px] text-gray-400">of {item.quantity}</span>
                                                            )}
                                                        </div>
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

                {/* Summary & Transfer Button */}
                <div className="flex justify-between items-center bg-gray-50 dark:bg-meta-4/20 p-4 rounded-xl border border-stroke dark:border-strokedark">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        <p>Unit Records Selected: <strong className="text-black dark:text-white">{selectedIds.length}</strong></p>
                        <p className="text-xs text-gray-400 mt-0.5">Total Units to Transfer: <strong className="text-primary">{totalUnitsSelected}</strong></p>
                    </div>
                    <button
                        onClick={initiateTransfer}
                        disabled={selectedIds.length === 0 || !selectedTargetId || loading}
                        className="flex items-center gap-2 bg-primary hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg text-sm font-bold shadow-md transition-all"
                    >
                        <Send size={18} />
                        {loading && !otpModalOpen ? "Processing..." : "Send OTP for Transfer"}
                    </button>
                </div>
            </div>

            {/* OTP Modal */}
            {otpModalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-boxdark rounded-2xl p-8 max-w-sm w-full shadow-2xl">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                            <KeyRound size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-center text-black dark:text-white mb-2">Verification Required</h3>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8 px-4">
                            Enter the OTP sent to the {transferType.toLowerCase()} to complete this transfer of <strong>{totalUnitsSelected}</strong> unit(s).
                        </p>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="_ _ _ _ _ _"
                            className="w-full text-center tracking-[0.5em] text-2xl font-bold border-2 border-stroke dark:border-strokedark rounded-xl px-4 py-4 outline-none focus:border-primary dark:bg-form-input dark:text-white mb-6"
                        />
                        {statusMessage.type === "error" && (
                            <p className="text-red-500 text-sm text-center mb-4">{statusMessage.text}</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setOtpModalOpen(false)}
                                className="flex-1 border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={verifyTransfer}
                                disabled={otp.length < 4 || loading}
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={18} />}
                                Verify & Transfer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
