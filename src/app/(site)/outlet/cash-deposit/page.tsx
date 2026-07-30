"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { DollarSign, Building, FileText, CheckCircle, XCircle, ArrowRightLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
});

type BankAccount = {
    id: number;
    bank_name: string;
    account_number: string;
    account_title: string;
};

type Outlet = {
    id: number;
    name: string;
    code: string;
};

type TransferRequest = {
    id: number;
    amount: number;
    status: string;
    description: string | null;
    created_at: string;
    receipt_photo_url: string | null;
    receipt_id: string | null;
    sender_outlet?: { id: number; name: string };
    receiver_outlet?: { id: number; name: string };
};

type BankDeposit = {
    id: number;
    amount: number;
    payment_method: string;
    status: string;
    receipt_id: string | null;
    receipt_photo_url: string | null;
    description: string | null;
    created_at: string;
    bank_account?: { bank_name: string; account_number: string } | null;
};

export default function CashDepositPage() {
    const [activeTab, setActiveTab] = useState<"deposit" | "transfer">("deposit");

    // Deposit State
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("manual_deposit");
    const [bankAccountId, setBankAccountId] = useState("");
    const [receiptId, setReceiptId] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [banks, setBanks] = useState<BankAccount[]>([]);

    // Transfer State
    const [transferAmount, setTransferAmount] = useState("");
    const [receiverOutletId, setReceiverOutletId] = useState("");
    const [transferReceiptId, setTransferReceiptId] = useState("");
    const [transferDesc, setTransferDesc] = useState("");
    const [transferFile, setTransferFile] = useState<File | null>(null);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    
    const [incomingTransfers, setIncomingTransfers] = useState<TransferRequest[]>([]);
    const [outgoingTransfers, setOutgoingTransfers] = useState<TransferRequest[]>([]);
    const [depositHistory, setDepositHistory] = useState<BankDeposit[]>([]);

    const fetchBanks = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/accounts/bank-accounts`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setBanks(data.data);
        } catch (err) { console.error(err); }
    };

    const fetchOutlets = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/outlet/list/basic`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setOutlets(data.data);
        } catch (err) { console.error(err); }
    };

    const fetchDepositHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/outlet/bank-deposits`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) setDepositHistory(data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchTransfers = async () => {
        try {
            const [inRes, outRes] = await Promise.all([
                fetch(`${API_BASE}/api/outlet/cash-transfers/incoming`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE}/api/outlet/cash-transfers/outgoing`, { headers: getAuthHeaders() })
            ]);
            const inData = await inRes.json();
            const outData = await outRes.json();
            if (inData.success) setIncomingTransfers(inData.data);
            if (outData.success) setOutgoingTransfers(outData.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchBanks();
        fetchOutlets();
        fetchTransfers();
        fetchDepositHistory();
    }, []);

    const handleDepositSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append("amount", amount);
        formData.append("payment_method", paymentMethod);
        if (bankAccountId) formData.append("bank_account_id", bankAccountId);
        if (receiptId) formData.append("receipt_id", receiptId);
        if (description) formData.append("description", description);
        if (file) formData.append("receipt_photo", file);

        try {
            const res = await fetch(`${API_BASE}/api/outlet/bank-deposits`, {
                method: "POST", headers: getAuthHeaders(), body: formData,
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Deposit request submitted successfully!");
                setAmount(""); setBankAccountId(""); setReceiptId(""); setDescription(""); setFile(null);
                fetchDepositHistory();
            } else { toast.error(data.message || "Failed to submit request."); }
        } catch (err) { toast.error("An error occurred. Please try again."); } 
        finally { setLoading(false); }
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append("amount", transferAmount);
        formData.append("receiver_outlet_id", receiverOutletId);
        if (transferReceiptId) formData.append("receipt_id", transferReceiptId);
        if (transferDesc) formData.append("description", transferDesc);
        if (transferFile) formData.append("receipt_photo", transferFile);

        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-transfers`, {
                method: "POST", headers: getAuthHeaders(), body: formData,
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Transfer request submitted successfully!");
                setTransferAmount(""); setReceiverOutletId(""); setTransferReceiptId(""); setTransferDesc(""); setTransferFile(null);
                fetchTransfers();
            } else { toast.error(data.message || "Failed to submit request."); }
        } catch (err) { toast.error("An error occurred. Please try again."); } 
        finally { setLoading(false); }
    };

    const handleTransferAction = async (id: number, action: 'accept' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this transfer? This action cannot be undone.`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-transfers/${id}/${action}`, {
                method: "POST", headers: getAuthHeaders(),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Transfer ${action}ed successfully!`);
                fetchTransfers();
            } else { toast.error(data.message || `Failed to ${action} transfer.`); }
        } catch (err) { toast.error("An error occurred. Please try again."); }
    };

    return (
        <>
            <Breadcrumb pageName="Cash Deposit & Transfers" />
            <div className="mx-auto max-w-5xl">

                {/* Tabs Header */}
                <div className="mb-6 flex space-x-4 border-b border-stroke dark:border-strokedark">
                    <button
                        className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ease-in-out
                            ${activeTab === 'deposit' 
                                ? 'text-primary border-b-2 border-primary' 
                                : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'}`}
                        onClick={() => setActiveTab('deposit')}
                    >
                        <Building size={18} /> Bank Deposit
                    </button>
                    <button
                        className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ease-in-out
                            ${activeTab === 'transfer' 
                                ? 'text-primary border-b-2 border-primary' 
                                : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'}`}
                        onClick={() => setActiveTab('transfer')}
                    >
                        <ArrowRightLeft size={18} /> Outlet Cash Transfer
                    </button>
                </div>

                {activeTab === 'deposit' && (
                    <div className="flex flex-col gap-6">
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white flex items-center gap-2">
                                <Building className="h-5 w-5" /> Submit Bank Deposit
                            </h3>
                        </div>
                        <form onSubmit={handleDepositSubmit} className="p-6.5">
                            <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                                <div className="w-full xl:w-1/2">
                                    <label className="mb-2.5 block text-black dark:text-white">Amount (PKR) <span className="text-meta-1">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4.5 top-4"><DollarSign size={20} /></span>
                                        <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 pl-12 pr-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" />
                                    </div>
                                </div>
                                <div className="w-full xl:w-1/2">
                                    <label className="mb-2.5 block text-black dark:text-white">Payment Method <span className="text-meta-1">*</span></label>
                                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary">
                                        <option value="manual_deposit">Manual Bank Deposit</option>
                                        <option value="1bill">1Bill Payment</option>
                                        <option value="qr_payment">QR Payment</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mb-4.5">
                                <label className="mb-2.5 block text-black dark:text-white">Select Bank Account</label>
                                <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary">
                                    <option value="">Select a bank (Optional)</option>
                                    {banks.map(b => (
                                        <option key={b.id} value={b.id}>{b.bank_name} - {b.account_title} ({b.account_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4.5">
                                <label className="mb-2.5 block text-black dark:text-white">Receipt ID / Reference No.</label>
                                <input type="text" value={receiptId} onChange={(e) => setReceiptId(e.target.value)} placeholder="Enter receipt ID" className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" />
                            </div>
                            <div className="mb-6">
                                <label className="mb-2.5 block text-black dark:text-white">Receipt Photo</label>
                                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary" />
                            </div>
                            <div className="mb-6">
                                <label className="mb-2.5 block text-black dark:text-white">Description (Optional)</label>
                                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add any extra notes..." className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" />
                            </div>
                            <button disabled={loading} type="submit" className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50">
                                {loading ? "Submitting..." : "Submit Bank Deposit"}
                            </button>
                        </form>
                    </div>

                    {/* Deposit History */}
                    <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" /> Bank Deposit History
                            </h3>
                        </div>
                        <div className="p-4">
                            {depositHistory.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No deposit history yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full table-auto">
                                        <thead>
                                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                                <th className="py-3 px-4 font-medium text-black dark:text-white text-sm">Date</th>
                                                <th className="py-3 px-4 font-medium text-black dark:text-white text-sm">Amount</th>
                                                <th className="py-3 px-4 font-medium text-black dark:text-white text-sm">Method</th>
                                                <th className="py-3 px-4 font-medium text-black dark:text-white text-sm">Receipt ID</th>
                                                <th className="py-3 px-4 font-medium text-black dark:text-white text-sm">Status</th>
                                                <th className="py-3 px-4 font-medium text-black dark:text-white text-sm">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {depositHistory.map(dep => (
                                                <tr key={dep.id}>
                                                    <td className="border-b border-[#eee] py-3 px-4 dark:border-strokedark text-sm">
                                                        {new Date(dep.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="border-b border-[#eee] py-3 px-4 dark:border-strokedark text-sm font-bold text-primary">
                                                        Rs {dep.amount.toLocaleString()}
                                                    </td>
                                                    <td className="border-b border-[#eee] py-3 px-4 dark:border-strokedark text-sm capitalize">
                                                        {dep.payment_method?.replace(/_/g, ' ')}
                                                    </td>
                                                    <td className="border-b border-[#eee] py-3 px-4 dark:border-strokedark text-sm text-gray-500">
                                                        {dep.receipt_id || '—'}
                                                    </td>
                                                    <td className="border-b border-[#eee] py-3 px-4 dark:border-strokedark text-sm">
                                                        <span className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-xs font-medium ${
                                                            dep.status === 'verified' ? 'bg-success text-success' :
                                                            dep.status === 'rejected' ? 'bg-danger text-danger' :
                                                            'bg-warning text-warning'
                                                        }`}>
                                                            {dep.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="border-b border-[#eee] py-3 px-4 dark:border-strokedark text-sm">
                                                        {dep.receipt_photo_url ? (
                                                            <a href={`${API_BASE}${dep.receipt_photo_url}`} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">View</a>
                                                        ) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {activeTab === 'transfer' && (
                    <div className="flex flex-col gap-6">
                        {/* Send Transfer Form */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white flex items-center gap-2">
                                    <ArrowRightLeft className="h-5 w-5 text-blue-500" /> Transfer Cash to Outlet
                                </h3>
                            </div>
                            <form onSubmit={handleTransferSubmit} className="p-6.5">
                                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                                    <div className="w-full xl:w-1/2">
                                        <label className="mb-2.5 block text-black dark:text-white">Amount (PKR) <span className="text-meta-1">*</span></label>
                                        <div className="relative">
                                            <span className="absolute left-4.5 top-4"><DollarSign size={20} /></span>
                                            <input type="number" required value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Enter amount" className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 pl-12 pr-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" />
                                        </div>
                                    </div>
                                    <div className="w-full xl:w-1/2">
                                        <label className="mb-2.5 block text-black dark:text-white">Target Outlet <span className="text-meta-1">*</span></label>
                                        <select required value={receiverOutletId} onChange={(e) => setReceiverOutletId(e.target.value)} className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary">
                                            <option value="">Select Outlet to send cash to</option>
                                            {outlets.map(o => (
                                                <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-4.5">
                                    <label className="mb-2.5 block text-black dark:text-white">Receipt ID / Reference No.</label>
                                    <input type="text" value={transferReceiptId} onChange={(e) => setTransferReceiptId(e.target.value)} placeholder="Enter receipt ID" className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" />
                                </div>
                                <div className="mb-6">
                                    <label className="mb-2.5 block text-black dark:text-white">Receipt Photo</label>
                                    <input type="file" onChange={(e) => setTransferFile(e.target.files?.[0] || null)} className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary" />
                                </div>
                                <div className="mb-6">
                                    <label className="mb-2.5 block text-black dark:text-white">Description (Optional)</label>
                                    <textarea rows={3} value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="Add any extra notes..." className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" />
                                </div>
                                <button disabled={loading} type="submit" className="flex w-full justify-center rounded bg-blue-600 p-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? "Sending Transfer..." : "Send Transfer Request"}
                                </button>
                            </form>
                        </div>

                        {/* Incoming Requests */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
                                <h3 className="font-medium text-black dark:text-white flex items-center gap-2">
                                    <ArrowDownLeft className="h-5 w-5 text-emerald-500" /> Incoming Requests (Needs Acceptance)
                                </h3>
                            </div>
                            <div className="p-4">
                                {incomingTransfers.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">No incoming transfers.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full table-auto">
                                            <thead>
                                                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                                    <th className="py-3 px-4 font-medium text-black dark:text-white">Date</th>
                                                    <th className="py-3 px-4 font-medium text-black dark:text-white">From</th>
                                                    <th className="py-3 px-4 font-medium text-black dark:text-white">Amount</th>
                                                    <th className="py-3 px-4 font-medium text-black dark:text-white">Status</th>
                                                    <th className="py-3 px-4 font-medium text-black dark:text-white">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {incomingTransfers.map(tr => (
                                                    <tr key={tr.id}>
                                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-sm">
                                                            {new Date(tr.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-sm font-medium">
                                                            {tr.sender_outlet?.name}
                                                        </td>
                                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                            Rs {tr.amount.toLocaleString()}
                                                        </td>
                                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-sm">
                                                            <span className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-xs font-medium ${
                                                                tr.status === 'accepted' ? 'bg-success text-success' : tr.status === 'rejected' ? 'bg-danger text-danger' : 'bg-warning text-warning'
                                                            }`}>
                                                                {tr.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-sm">
                                                            {tr.status === 'pending' && (
                                                                <div className="flex items-center space-x-2">
                                                                    <button onClick={() => handleTransferAction(tr.id, 'accept')} className="text-emerald-500 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">Accept</button>
                                                                    <button onClick={() => handleTransferAction(tr.id, 'reject')} className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">Reject</button>
                                                                </div>
                                                            )}
                                                            {tr.status !== 'pending' && (
                                                                <span className="text-gray-400 text-xs">Action taken</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Outgoing Requests */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white flex items-center gap-2">
                                    <ArrowUpRight className="h-5 w-5 text-blue-500" /> Outgoing Transfer History
                                </h3>
                            </div>
                            <div className="p-4">
                                {outgoingTransfers.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">No outgoing transfers.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full table-auto">
                                            <thead>
                                                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                                    <th className="py-3 px-4 font-medium text-black dark:text-white">Date</th>
                                                    <th className="py-3 px-4 font-medium text-black dark:text-white">To</th>
                                                    <th className="py-3 px-4 font-medium text-black dark:text-white">Amount</th>
                                                    <th className="py-3 px-4 font-medium text-black dark:text-white">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {outgoingTransfers.map(tr => (
                                                    <tr key={tr.id}>
                                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-sm">
                                                            {new Date(tr.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-sm">
                                                            {tr.receiver_outlet?.name}
                                                        </td>
                                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-sm font-medium">
                                                            Rs {tr.amount.toLocaleString()}
                                                        </td>
                                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-sm">
                                                            <span className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-xs font-medium ${
                                                                tr.status === 'accepted' ? 'bg-success text-success' : tr.status === 'rejected' ? 'bg-danger text-danger' : 'bg-warning text-warning'
                                                            }`}>
                                                                {tr.status.toUpperCase()}
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
                    </div>
                )}
            </div>
        </>
    );
}
