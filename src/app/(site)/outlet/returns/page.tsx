"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { PackageX, ArchiveRestore, Clock, ArrowRightLeft, Search, RefreshCw } from "lucide-react";
import Loader from "@/components/common/Loader";
import ReturnVerificationPopup from "@/components/ReturnVerificationPopup";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token")}`,
});

export default function ReturnExchangesPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifyingRecord, setVerifyingRecord] = useState<any | null>(null);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/return-exchanges`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                setRecords(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const pendingRecords = records.filter(r => r.status === 'pending');
    const completedRecords = records.filter(r => r.status === 'verified');

    if (loading) return <Loader text="Loading Returns & Exchanges..." />;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Returns & Exchanges" />

            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ArrowRightLeft className="text-primary" /> Return & Exchange Management
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Receive returning stock from delivery officers via OTP.</p>
                </div>
                <button 
                    onClick={fetchRecords}
                    className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                    <RefreshCw size={16} /> Refresh List
                </button>
            </div>

            {/* Pending Actions */}
            <div className="mb-10">
                <h2 className="text-sm font-black uppercase tracking-widest text-warning flex items-center gap-2 mb-4 ml-1">
                    <Clock size={16} /> Pending Drop-offs ({pendingRecords.length})
                </h2>
                {pendingRecords.length === 0 ? (
                    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-10 text-center text-gray-400">
                        <PackageX size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-bold text-sm uppercase tracking-widest">No pending drop-offs</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingRecords.map(r => (
                            <div key={r.id} className="bg-white dark:bg-boxdark rounded-2xl p-5 border border-warning/30 border-l-4 border-l-warning shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="text-xs font-black uppercase text-warning tracking-widest bg-warning/10 px-2 py-1 rounded-md">
                                        {r.type} Request
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                                    {r.order?.order_ref || 'Unknown Ref'}
                                </h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 space-y-1">
                                    <p><span className="font-medium text-gray-600 dark:text-gray-300">Officer:</span> {r.delivery_officer?.full_name}</p>
                                    <p><span className="font-medium text-gray-600 dark:text-gray-300">Phone:</span> {r.delivery_officer?.phone}</p>
                                    {r.imei_returned && <p><span className="font-medium text-gray-600 dark:text-gray-300">Returning IMEI:</span> {r.imei_returned}</p>}
                                </div>
                                <button 
                                    onClick={() => setVerifyingRecord(r)}
                                    className="w-full py-2.5 bg-warning hover:bg-opacity-90 text-white rounded-xl text-sm font-bold shadow transition-all active:scale-95"
                                >
                                    Receive via OTP
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History */}
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-success flex items-center gap-2 mb-4 ml-1">
                    <ArchiveRestore size={16} /> Completed Restocks ({completedRecords.length})
                </h2>
                <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden mb-20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
                                <tr className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="px-5 py-4">Ref</th>
                                    <th className="px-5 py-4">Type</th>
                                    <th className="px-5 py-4">Officer</th>
                                    <th className="px-5 py-4">Returning IMEI</th>
                                    <th className="px-5 py-4">Date Verified</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stroke dark:divide-strokedark">
                                {completedRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-gray-400 font-medium">No restock history available.</td>
                                    </tr>
                                ) : completedRecords.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-all">
                                        <td className="px-5 py-4 font-bold text-gray-800 dark:text-white">{r.order?.order_ref}</td>
                                        <td className="px-5 py-4"><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-bold">{r.type}</span></td>
                                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{r.delivery_officer?.full_name}</td>
                                        <td className="px-5 py-4 font-mono text-gray-500">{r.imei_returned || 'N/A'}</td>
                                        <td className="px-5 py-4 text-success font-medium">
                                            {r.verified_at ? new Date(r.verified_at).toLocaleString() : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {verifyingRecord && (
                <ReturnVerificationPopup 
                    isOpen={!!verifyingRecord}
                    onClose={() => setVerifyingRecord(null)}
                    recordId={verifyingRecord.id}
                    orderRef={verifyingRecord.order?.order_ref || 'Unknown'}
                    officerName={verifyingRecord.delivery_officer?.full_name || 'Officer'}
                    onSuccess={() => {
                        fetchRecords();
                    }}
                />
            )}
        </div>
    );
}
