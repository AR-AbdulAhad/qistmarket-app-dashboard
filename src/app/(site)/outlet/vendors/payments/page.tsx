"use client";

import { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
    CreditCard, Plus, Search, Filter,
    History, TrendingUp, AlertCircle,
    CheckCircle2, Building2, Calendar,
    ChevronRight, Wallet, ArrowUpRight, ShoppingCart
} from "lucide-react";
import Loader from "@/components/common/Loader";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

interface VendorSummary {
    vendor_name: string;
    _sum: {
        total_amount: number;
        paid_amount: number;
        balance: number;
    }
}

interface Payment {
    id: number;
    purchase_id: number;
    vendor_name: string;
    amount: number;
    payment_method: string;
    notes?: string;
    created_at: string;
}

interface BasicPurchase {
    id: number;
    invoice_number: string;
    vendor_name: string;
    total_amount: number;
    balance: number;
    due_date?: string;
}

export default function VendorPaymentsPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<VendorSummary[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [purchases, setPurchases] = useState<BasicPurchase[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form State
    const [form, setForm] = useState({
        purchase_id: "",
        amount: "",
        payment_method: "Cash",
        notes: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sumRes, payRes, purRes] = await Promise.all([
                fetch(`${API_BASE}/api/outlet/vendors/summary`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/api/outlet/vendors/payments`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/api/outlet/vendors/purchases`, { headers: getAuthHeaders() }),
            ]);

            const [sumData, payData, purData] = await Promise.all([
                sumRes.json(), payRes.json(), purRes.json()
            ]);

            if (sumData.success) setSummary(sumData.summary);
            if (payData.success) setPayments(payData.payments);
            if (purData.success) {
                // Only show purchases with balance > 0 for recording new payments
                setPurchases(purData.purchases.filter((p: any) => p.balance > 0));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.purchase_id || !form.amount) return setError("Please select an invoice and enter amount.");

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`${API_BASE}/api/outlet/vendors/payments`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    purchase_id: parseInt(form.purchase_id),
                    amount: parseFloat(form.amount),
                    payment_method: form.payment_method,
                    notes: form.notes
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess("Payment recorded successfully!");
                setForm({ purchase_id: "", amount: "", payment_method: "Cash", notes: "" });
                setTimeout(() => {
                    setShowModal(false);
                    fetchData();
                }, 1500);
            } else {
                setError(data.message || "Failed to record payment.");
            }
        } catch (err) {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    const selectedPurchase = purchases.find(p => p.id === parseInt(form.purchase_id));

    const globalStats = useMemo(() => {
        const totalOwed = summary.reduce((s, v) => s + (v?._sum?.balance || 0), 0);
        const totalPaid = summary.reduce((s, v) => s + (v?._sum?.paid_amount || 0), 0);
        return { totalOwed, totalPaid };
    }, [summary]);

    if (loading) return <Loader text="Loading Finance Data..." />;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Vendor Payments" />

            {/* Header Section */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Wallet className="text-primary" /> Vendor Payments & Ledger
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Settle outstanding balances and track payment history</p>
                </div>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setError("");
                        setSuccess("");
                    }}
                    className="bg-primary hover:bg-opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg transition-all active:scale-95"
                >
                    <Plus size={18} /> Record New Payment
                </button>
            </div>

            {/* Top Cards: Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-sm border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Outstanding</div>
                        <AlertCircle size={16} className="text-red-500 opacity-50" />
                    </div>
                    <div className="text-2xl font-black text-red-600">PKR {globalStats.totalOwed.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold italic">Total liability across all vendors</div>
                </div>

                <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-sm border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Settle (Paid)</div>
                        <CheckCircle2 size={16} className="text-green-500 opacity-50" />
                    </div>
                    <div className="text-2xl font-black text-green-600">PKR {globalStats.totalPaid.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold italic">Cumulative cleared payments</div>
                </div>

                {/* Display Top Owed Vendor */}
                {summary.length > 0 && (
                    <div className="bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-sm col-span-1 md:col-span-2 flex items-center gap-4 overflow-hidden relative">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform hover:scale-110">
                            <TrendingUp size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Top Vendor Liability</div>
                            <div className="text-lg font-black truncate">
                                {summary.sort((a, b) => ((b?._sum?.balance || 0) - (a?._sum?.balance || 0)))[0]?.vendor_name || 'N/A'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-black text-red-600 tabular-nums">
                                PKR {(summary.sort((a, b) => ((b?._sum?.balance || 0) - (a?._sum?.balance || 0)))[0]?._sum?.balance || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Pending Balance</div>
                        </div>
                        <ArrowUpRight className="absolute -right-2 -top-2 text-gray-300 opacity-10" size={100} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                {/* LEFT: Vendor Wise Summary Table */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Building2 size={14} /> Vendor Summary Ledger
                            </h2>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="sticky top-0 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark z-10 shadow-sm">
                                    <tr className="text-gray-400 font-bold">
                                        <th className="p-3">Vendor</th>
                                        <th className="p-3 text-right">Owed</th>
                                        <th className="p-3 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                                    {summary.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-gray-400 italic">No vendor transactions yet.</td></tr>
                                    ) : summary.map((v, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-all font-medium">
                                            <td className="p-3 font-bold truncate max-w-[120px] text-gray-700 dark:text-gray-300">{v.vendor_name}</td>
                                            <td className="p-3 text-right tabular-nums text-gray-500">PKR {v._sum.total_amount?.toLocaleString()}</td>
                                            <td className="p-3 text-right font-black tabular-nums text-red-600 dark:text-red-400">PKR {v._sum.balance?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Global Payment History */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <History size={14} /> Global Payment Transaction History
                            </h2>
                            <div className="flex gap-2">
                                <button className="p-1.5 hover:bg-white dark:hover:bg-boxdark rounded-lg text-gray-400 transition-colors">
                                    <Filter size={14} />
                                </button>
                                <button className="p-1.5 hover:bg-white dark:hover:bg-boxdark rounded-lg text-gray-400 transition-colors">
                                    <Search size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-meta-4 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                        <th className="p-4">Reference Date</th>
                                        <th className="p-4">Vendor</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4 text-right">Amount Settle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-20 text-center text-gray-400 opacity-60">
                                                <CreditCard size={40} className="mx-auto mb-4" />
                                                <div className="font-bold uppercase tracking-widest">No payment history available</div>
                                            </td>
                                        </tr>
                                    ) : payments.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-all group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-800 dark:text-white tabular-nums">#{p.id.toString().padStart(4, '0')}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase font-bold">{new Date(p.created_at).toLocaleDateString("en-PK", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-black text-gray-700 dark:text-gray-300">{p.vendor_name}</div>
                                                <div className="text-[10px] text-gray-400 italic">Invoice Ref: Settle Partial</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.payment_method === 'Cash' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                                                        p.payment_method === 'Bank Transfer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                                                            'bg-violet-100 text-violet-700 dark:bg-violet-900/30'
                                                    }`}>
                                                    {p.payment_method}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="font-black text-primary text-sm tabular-nums">PKR {p.amount.toLocaleString()}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center justify-end gap-1">
                                                    Process Complete <CheckCircle2 size={10} className="text-green-500" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all" onClick={() => !saving && setShowModal(false)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-boxdark rounded-3xl shadow-2xl overflow-hidden border border-stroke dark:border-strokedark animate-zoom-in">
                        <div className="p-6 bg-primary text-white relative">
                            <h2 className="text-xl font-black flex items-center gap-2">
                                <CreditCard size={24} /> Record Vendor Payment
                            </h2>
                            <p className="text-xs opacity-70 mt-1 uppercase tracking-widest font-bold">Process procurement settlement</p>
                            <ShoppingCart className="absolute -right-4 -bottom-4 opacity-10" size={100} />
                        </div>

                        <form onSubmit={handleRecordPayment} className="p-8 space-y-6">
                            {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100 flex items-center gap-2 animate-head-shake"><AlertCircle size={16} /> {error}</div>}
                            {success && <div className="p-4 rounded-xl bg-green-50 text-green-600 text-xs font-bold border border-green-100 flex items-center gap-2 animate-bounce"><CheckCircle2 size={16} /> {success}</div>}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Purchase Invoice *</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <select
                                            value={form.purchase_id}
                                            onChange={e => setForm({ ...form, purchase_id: e.target.value, amount: purchases.find(p => p.id === parseInt(e.target.value))?.balance.toString() || "" })}
                                            className="w-full pl-12 pr-5 py-3 rounded-2xl bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark outline-none focus:border-primary text-sm font-bold transition-all appearance-none"
                                        >
                                            <option value="">Choose an outstanding invoice...</option>
                                            {purchases.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.invoice_number} — {p.vendor_name} (Bal: PKR {p.balance.toLocaleString()} | Due: {p.due_date ? new Date(p.due_date).toLocaleDateString() : 'N/A'})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                                    </div>
                                </div>

                                {selectedPurchase && (
                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between animate-fade-in">
                                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">Outstanding Balance</div>
                                        <div className="text-lg font-black text-primary tabular-nums">PKR {selectedPurchase.balance.toLocaleString()}</div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Amount (PKR) *</label>
                                        <input
                                            type="number"
                                            value={form.amount}
                                            onChange={e => setForm({ ...form, amount: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark outline-none focus:border-primary text-sm font-black tabular-nums transition-all"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Method</label>
                                        <select
                                            value={form.payment_method}
                                            onChange={e => setForm({ ...form, payment_method: e.target.value })}
                                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark outline-none focus:border-primary text-sm font-bold transition-all appearance-none"
                                        >
                                            {["Cash"].map(m => <option key={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Notes</label>
                                    <textarea
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Reference details, check number..."
                                        rows={2}
                                        className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark outline-none focus:border-primary text-sm font-medium transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => !saving && setShowModal(false)}
                                    className="flex-1 py-3.5 rounded-2xl text-sm font-black text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-primary text-white py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {saving ? "Processing..." : "Confirm Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
