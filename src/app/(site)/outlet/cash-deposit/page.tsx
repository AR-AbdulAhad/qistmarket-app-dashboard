"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Upload, DollarSign, Building, FileText, CheckCircle } from "lucide-react";

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

export default function CashDepositPage() {
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("manual_deposit");
    const [bankAccountId, setBankAccountId] = useState("");
    const [receiptId, setReceiptId] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    
    const [banks, setBanks] = useState<BankAccount[]>([]);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/accounts/bank-accounts`, {
                    headers: getAuthHeaders(),
                });
                const data = await res.json();
                if (data.success) {
                    setBanks(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch banks", err);
            }
        };
        fetchBanks();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
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
                method: "POST",
                headers: getAuthHeaders(),
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Deposit request submitted successfully!");
                // Reset form
                setAmount("");
                setPaymentMethod("manual_deposit");
                setBankAccountId("");
                setReceiptId("");
                setDescription("");
                setFile(null);
            } else {
                toast.error(data.message || "Failed to submit request.");
            }
        } catch (err) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Breadcrumb pageName="Submit Cash Deposit" />
            <div className="mx-auto max-w-3xl">
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white flex items-center gap-2">
                            <Building className="h-5 w-5" /> Bank Transfer / Cash Deposit
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6.5">
                        <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                            <div className="w-full xl:w-1/2">
                                <label className="mb-2.5 block text-black dark:text-white">Amount (PKR) <span className="text-meta-1">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4.5 top-4"><DollarSign size={20} /></span>
                                    <input 
                                        type="number" 
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount" 
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 pl-12 pr-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" 
                                    />
                                </div>
                            </div>
                            
                            <div className="w-full xl:w-1/2">
                                <label className="mb-2.5 block text-black dark:text-white">Payment Method <span className="text-meta-1">*</span></label>
                                <select 
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                >
                                    <option value="manual_deposit">Manual Bank Deposit</option>
                                    <option value="1bill">1Bill Payment</option>
                                    <option value="qr_payment">QR Payment</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">Select Bank Account</label>
                            <select 
                                value={bankAccountId}
                                onChange={(e) => setBankAccountId(e.target.value)}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            >
                                <option value="">Select a bank (Optional)</option>
                                {banks.map(b => (
                                    <option key={b.id} value={b.id}>{b.bank_name} - {b.account_title} ({b.account_number})</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4.5">
                            <label className="mb-2.5 block text-black dark:text-white">Receipt ID / Reference No.</label>
                            <input 
                                type="text" 
                                value={receiptId}
                                onChange={(e) => setReceiptId(e.target.value)}
                                placeholder="Enter receipt ID" 
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" 
                            />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2.5 block text-black dark:text-white">Receipt Photo</label>
                            <div className="flex items-center gap-4">
                                <label className="flex cursor-pointer items-center justify-center gap-2 rounded bg-primary py-2 px-4 font-medium text-white hover:bg-opacity-90">
                                    <Upload size={18} />
                                    Choose File
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setFile(e.target.files[0]);
                                        }
                                    }} />
                                </label>
                                {file && <span className="text-sm font-medium">{file.name}</span>}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="mb-2.5 block text-black dark:text-white">Description (Optional)</label>
                            <textarea 
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter any additional details" 
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary" 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded bg-primary p-3 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                        >
                            {loading ? "Submitting..." : <><CheckCircle size={20} /> Submit Deposit Request</>}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
