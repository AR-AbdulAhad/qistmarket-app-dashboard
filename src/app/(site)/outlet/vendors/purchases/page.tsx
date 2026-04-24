"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { 
    Plus, Search, Download, Upload, Printer, Trash2, 
    ChevronDown, ChevronRight, FileText, ShoppingCart, 
    CreditCard, AlertCircle, CheckCircle2, History, X,
    Filter, Settings, CheckSquare, Square
} from "lucide-react";
import * as XLSX from "xlsx";
import Loader from "@/components/common/Loader";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

interface PurchaseItem {
    id: number;
    product_name: string;
    category?: string;
    color_variant?: string;
    imei_serial?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface Purchase {
    id: number;
    invoice_number: string;
    vendor_name: string;
    total_amount: number;
    paid_amount: number;
    balance: number;
    status: string;
    purchase_date: string;
    due_date?: string;
    notes?: string;
    items: PurchaseItem[];
}

export default function VendorPurchasesPage() {
    const router = useRouter();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // Advanced Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        includeItems: true,
        selectedVendors: [] as string[]
    });

    useEffect(() => { fetchPurchases(); }, []);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/vendors/purchases`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setPurchases(data.purchases);
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoading(false); 
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const requestDelete = (id: number) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;
        const id = confirmDeleteId;
        setConfirmDeleteId(null);
        setDeletingId(id);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/vendors/purchases/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                setPurchases(prev => prev.filter(p => p.id !== id));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredPurchases = useMemo(() => {
        return purchases.filter(p => 
            p.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [purchases, searchTerm]);

    const uniqueVendors = useMemo(() => {
        return Array.from(new Set(purchases.map(p => p.vendor_name))).sort();
    }, [purchases]);

    const stats = useMemo(() => {
        const totalPurchased = purchases.reduce((s, p) => s + p.total_amount, 0);
        const totalPaid = purchases.reduce((s, p) => s + p.paid_amount, 0);
        const totalBalance = purchases.reduce((s, p) => s + p.balance, 0);
        return { totalPurchased, totalPaid, totalBalance };
    }, [purchases]);

    const handleAdvancedExport = () => {
        let dataToExport: any[] = [];
        
        // Filter by selected vendors
        const baseFiltered = filteredPurchases.filter(p => 
            exportOptions.selectedVendors.length === 0 || exportOptions.selectedVendors.includes(p.vendor_name)
        );

        if (exportOptions.includeItems) {
            // Detailed Export (with Item Details)
            baseFiltered.forEach(p => {
                p.items.forEach(item => {
                    dataToExport.push({
                        "Invoice #": p.invoice_number,
                        "Date": new Date(p.purchase_date).toLocaleDateString(),
                        "Vendor": p.vendor_name,
                        "Product": item.product_name,
                        "Category": item.category || "N/A",
                        "Variant": item.color_variant || "N/A",
                        "IMEI/Serial": item.imei_serial || "Batch",
                        "Qty": item.quantity,
                        "Unit Price": item.unit_price,
                        "Subtotal": item.total_price,
                        "Invoice Status": p.status
                    });
                });
            });
        } else {
            // Summary Export (Invoice only)
            dataToExport = baseFiltered.map(p => ({
                "Invoice #": p.invoice_number,
                "Date": new Date(p.purchase_date).toLocaleDateString(),
                "Vendor": p.vendor_name,
                "Billed Amount": p.total_amount,
                "Paid Amount": p.paid_amount,
                "Balance Due": p.balance,
                "Status": p.status,
                "Notes": p.notes || ""
            }));
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, exportOptions.includeItems ? "Detailed_Report" : "Summary_Report");
        XLSX.writeFile(workbook, `Procurement_${exportOptions.includeItems ? 'Detailed' : 'Summary'}_${new Date().toISOString().split('T')[0]}.xlsx`);
        setShowExportModal(false);
    };

    const handlePrintNewTab = (id: number) => {
        window.open(`/outlet/vendors/purchases/invoice/${id}`, '_blank');
    };

    if (loading) return <Loader text="Loading Vendor Purchases..." />;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Vendor Purchases" />

            {/* Header Section */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="text-primary" /> Vendor Purchase Inventory
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage vendor procurement and purchase history</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => router.push("/outlet/vendors/purchases/add")}
                        className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <Upload size={16} /> Import Items
                    </button>
                    <button 
                        onClick={() => setShowExportModal(true)}
                        className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                        <Download size={16} /> Advanced Export
                    </button>
                    <button 
                        onClick={() => router.push("/outlet/vendors/purchases/add")}
                        className="bg-primary hover:bg-opacity-90 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        <Plus size={18} /> New Purchase
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <ShoppingCart size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Purchases</span>
                    </div>
                    <div className="text-2xl font-black text-gray-800 dark:text-white">PKR {stats.totalPurchased.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Lifetime procurement value</div>
                </div>

                <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle2 size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paid Amount</span>
                    </div>
                    <div className="text-2xl font-black text-green-600 dark:text-green-400">PKR {stats.totalPaid.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Total payments processed</div>
                </div>

                <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                            <AlertCircle size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance Due</span>
                    </div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-400">PKR {stats.totalBalance.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Outstanding vendor liability</div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
                <div className="p-4 border-b border-stroke dark:border-strokedark flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by vendor or invoice..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark focus:border-primary outline-none text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-meta-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="p-4 w-10" />
                                <th className="p-4">Invoice / Date</th>
                                <th className="p-4">Vendor</th>
                                <th className="p-4">Due Date</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Paid</th>
                                <th className="p-4">Balance</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center text-gray-400 opacity-60">
                                        <ShoppingCart size={48} className="mx-auto mb-4" />
                                        <div className="font-medium">No purchase records found</div>
                                    </td>
                                </tr>
                            ) : filteredPurchases.map(p => {
                                const isExpanded = expandedIds.has(p.id);
                                return (
                                    <Fragment key={p.id}>
                                        <tr 
                                            onClick={() => toggleExpand(p.id)}
                                            className={`group border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors cursor-pointer ${isExpanded ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                        >
                                            <td className="p-4 text-center">
                                                {isExpanded ? <ChevronDown size={16} className="text-primary mx-auto" /> : <ChevronRight size={16} className="text-gray-400 mx-auto" />}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800 dark:text-white uppercase tracking-tight">{p.invoice_number}</div>
                                                <div className="text-[10px] text-gray-500 mt-0.5">{new Date(p.purchase_date).toLocaleDateString("en-PK", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-700 dark:text-gray-300">{p.vendor_name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">ID: #{p.id}</div>
                                            </td>
                                            <td className="p-4">
                                                {p.due_date ? (
                                                    <div className={`text-xs font-bold ${new Date(p.due_date) < new Date() && p.balance > 0 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                                                        {new Date(p.due_date).toLocaleDateString()}
                                                        {new Date(p.due_date) < new Date() && p.balance > 0 && <span className="block text-[8px] uppercase tracking-tighter">Overdue</span>}
                                                    </div>
                                                ) : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="p-4 font-black">PKR {p.total_amount.toLocaleString()}</td>
                                            <td className="p-4 text-green-600 dark:text-green-400 font-bold">PKR {p.paid_amount.toLocaleString()}</td>
                                            <td className="p-4 text-red-600 dark:text-red-400 font-bold">PKR {p.balance.toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    p.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    p.status === 'Partial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handlePrintNewTab(p.id)}
                                                        title="Print Invoice / Generate PDF" 
                                                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all active:scale-95"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => requestDelete(p.id)}
                                                        disabled={deletingId === p.id}
                                                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* ITEMS EXPANSION */}
                                        {isExpanded && (
                                            <tr className="bg-gray-50/50 dark:bg-meta-4/10">
                                                <td colSpan={9} className="p-0 border-b border-stroke dark:border-strokedark">
                                                    <div className="px-14 py-6">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                                <FileText size={14} className="text-primary" /> Purchase Items
                                                            </div>
                                                            {p.notes && (
                                                                <div className="text-xs text-gray-400 italic">" {p.notes} "</div>
                                                            )}
                                                        </div>
                                                        <div className="overflow-hidden rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark text-gray-500">
                                                                        <th className="p-3">#</th>
                                                                        <th className="p-3">Product Item</th>
                                                                        <th className="p-3">Variant</th>
                                                                        <th className="p-3">IMEI / Serial</th>
                                                                        <th className="p-3 text-center">Qty</th>
                                                                        <th className="p-3 text-right">Unit Price</th>
                                                                        <th className="p-3 text-right">Subtotal</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {p.items.map((item, idx) => (
                                                                        <tr key={item.id} className="border-b border-stroke dark:border-strokedark last:border-0 hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                                                            <td className="p-3 text-gray-400 font-mono">{idx + 1}</td>
                                                                            <td className="p-3">
                                                                                <div className="font-bold text-gray-700 dark:text-gray-300">{item.product_name}</div>
                                                                                <div className="text-[10px] text-gray-400">{item.category || 'N/A'}</div>
                                                                            </td>
                                                                            <td className="p-3">
                                                                                {item.color_variant ? (
                                                                                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-full text-[10px] font-bold lowercase">
                                                                                        {item.color_variant}
                                                                                    </span>
                                                                                ) : '—'}
                                                                            </td>
                                                                            <td className="p-3 font-mono text-gray-600 dark:text-gray-400">{item.imei_serial || 'Generic'}</td>
                                                                            <td className="p-3 text-center font-bold">{item.quantity}</td>
                                                                            <td className="p-3 text-right">PKR {item.unit_price.toLocaleString()}</td>
                                                                            <td className="p-3 text-right font-bold text-gray-900 dark:text-white">PKR {item.total_price.toLocaleString()}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                                <tfoot>
                                                                    <tr className="bg-gray-50/50 dark:bg-meta-4/30 font-bold">
                                                                        <td colSpan={6} className="p-3 text-right uppercase text-gray-500 tracking-wider">Invoice Total</td>
                                                                        <td className="p-3 text-right text-primary text-base">PKR {p.total_amount.toLocaleString()}</td>
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADVANCED EXPORT MODAL */}
            {showExportModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExportModal(false)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-boxdark rounded-3xl shadow-2xl overflow-hidden border border-stroke dark:border-strokedark animate-zoom-in">
                        <div className="p-6 bg-primary text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <Download size={24} /> Advanced Data Export
                                </h2>
                                <p className="text-[10px] opacity-70 uppercase tracking-widest font-black mt-1">Excel & Spreadsheet Selection</p>
                            </div>
                            <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Option 1: Detailed Items Toggles */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Export Detail Level</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setExportOptions({...exportOptions, includeItems: false})}
                                        className={`p-4 rounded-2xl border-2 flex flex-col gap-1.5 transition-all text-left ${!exportOptions.includeItems ? 'border-primary bg-primary/5' : 'border-stroke dark:border-strokedark'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <FileText size={20} className={!exportOptions.includeItems ? 'text-primary' : 'text-gray-400'} />
                                            {!exportOptions.includeItems ? <CheckSquare className="text-primary" size={16} /> : <Square className="text-gray-300" size={16} />}
                                        </div>
                                        <div className="font-black text-sm">Summary Only</div>
                                        <div className="text-[10px] text-gray-400 italic">One row per invoice. Quick financial overview.</div>
                                    </button>
                                    <button 
                                        onClick={() => setExportOptions({...exportOptions, includeItems: true})}
                                        className={`p-4 rounded-2xl border-2 flex flex-col gap-1.5 transition-all text-left ${exportOptions.includeItems ? 'border-primary bg-primary/5' : 'border-stroke dark:border-strokedark'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Settings size={20} className={exportOptions.includeItems ? 'text-primary' : 'text-gray-400'} />
                                            {exportOptions.includeItems ? <CheckSquare className="text-primary" size={16} /> : <Square className="text-gray-300" size={16} />}
                                        </div>
                                        <div className="font-black text-sm">Detailed Items</div>
                                        <div className="text-[10px] text-gray-400 italic">Include every item, IMEI, and color variant.</div>
                                    </button>
                                </div>
                            </div>

                            {/* Option 2: Selective Vendors */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Vendors</label>
                                    <button 
                                        onClick={() => setExportOptions({...exportOptions, selectedVendors: []})}
                                        className="text-[10px] font-black text-primary uppercase"
                                    >
                                        Reset Selected
                                    </button>
                                </div>
                                <div className="bg-gray-50 dark:bg-meta-4 rounded-2xl border border-stroke dark:border-strokedark p-4 max-h-[200px] overflow-y-auto space-y-2">
                                    {uniqueVendors.length === 0 ? (
                                        <div className="text-[10px] text-gray-400 text-center py-4 uppercase font-black">No vendors available</div>
                                    ) : uniqueVendors.map(v => (
                                        <label key={v} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-boxdark rounded-xl cursor-pointer transition-colors group">
                                            <input 
                                                type="checkbox"
                                                checked={exportOptions.selectedVendors.includes(v)}
                                                onChange={() => {
                                                    const current = exportOptions.selectedVendors;
                                                    setExportOptions({
                                                        ...exportOptions,
                                                        selectedVendors: current.includes(v) ? current.filter(x => x !== v) : [...current, v]
                                                    });
                                                }}
                                                className="hidden"
                                            />
                                            {exportOptions.selectedVendors.includes(v) ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-gray-300 group-hover:text-gray-400" />}
                                            <span className={`text-sm font-bold ${exportOptions.selectedVendors.includes(v) ? 'text-gray-800' : 'text-gray-400'}`}>{v}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleAdvancedExport}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                <Download size={20} /> Prepare & Download Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE MODAL */}
            {confirmDeleteId !== null && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-boxdark rounded-[2rem] shadow-2xl p-8 text-center animate-zoom-in border border-stroke dark:border-strokedark">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">Delete Invoice?</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 font-bold leading-relaxed max-w-xs mx-auto">
                            Are you sure you want to delete this purchase invoice? This action <span className="text-red-500 font-black">cannot be undone</span> and will not automatically remove items from inventory.
                        </p>
                        <div className="flex items-center gap-3 w-full">
                            <button 
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-3.5 bg-gray-100 dark:bg-meta-4 text-gray-500 dark:text-gray-300 rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-meta-4/80 transition-all active:scale-95 text-sm uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95 text-sm uppercase tracking-widest"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
