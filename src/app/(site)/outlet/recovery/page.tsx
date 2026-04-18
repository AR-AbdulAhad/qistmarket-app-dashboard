"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Search, Hash, Phone, User, Banknote, DollarSign, Eye, RefreshCw, Layers } from "lucide-react";
import { toast } from "react-hot-toast";
import OfficerDetailsModal from "@/components/Outlet/OfficerDetailsModal";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function RecoveryOfficersListing() {
    const [officers, setOfficers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(null);

    const fetchOfficers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/team/list?role_id=3`, {
                headers: {
                    Authorization: `Bearer ${Cookies.get("auth_token")}`,
                }
            });
            const data = await res.json();
            if (data.success) {
                setOfficers(data.officers);
            }
        } catch (err) {
            toast.error("Failed to load recovery officers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOfficers();
    }, []);

    const filtered = officers.filter(o => 
        o.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Recovery Officers" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-2xl text-orange-500">
                            <Layers size={30} strokeWidth={2.5} />
                        </div>
                        Recovery Team
                    </h1>
                    <p className="text-sm text-gray-400 mt-2 font-bold tracking-tight">Track installment collections, assigned customers and pending cash.</p>
                </div>
                <button 
                    onClick={fetchOfficers}
                    className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 hover:bg-gray-50 px-6 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh List
                </button>
            </div>

            {/* Search */}
            <div className="mb-8 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by officer name, username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 rounded-[2rem] bg-white dark:bg-boxdark border-2 border-transparent focus:border-orange-500/20 outline-none shadow-xl shadow-gray-100 dark:shadow-none font-bold text-sm transition-all"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-100 dark:bg-meta-4 rounded-[2.5rem] animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map((officer) => (
                        <OfficerCard 
                            key={officer.id} 
                            officer={officer} 
                            onClick={() => setSelectedOfficerId(officer.id)} 
                        />
                    ))}
                </div>
            )}

            <OfficerDetailsModal 
                isOpen={!!selectedOfficerId} 
                onClose={() => setSelectedOfficerId(null)} 
                officerId={selectedOfficerId} 
            />
        </div>
    );
}

function OfficerCard({ officer, onClick }: { officer: any, onClick: () => void }) {
    return (
        <div className="bg-white dark:bg-boxdark rounded-[2.5rem] border border-stroke dark:border-strokedark shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 overflow-hidden group">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500 font-black text-xl group-hover:scale-110 transition-transform duration-500">
                        {officer.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        officer.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                        {officer.status}
                    </span>
                </div>

                <h3 className="text-xl font-black text-gray-800 dark:text-white truncate pb-1">{officer.full_name}</h3>
                <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                    <Phone size={14} className="text-orange-500/50" /> {officer.phone || "No phone"}
                </p>

                <div className="mt-8 space-y-4">
                    <div className="p-5 bg-gray-50 dark:bg-meta-4/20 rounded-2xl border border-transparent hover:border-orange-500/20 transition-colors flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-1 flex items-center gap-1">
                                <DollarSign size={10} /> In Hand (Pending)
                            </p>
                            <p className="text-2xl font-black text-orange-600 dark:text-orange-400 tabular-nums">
                                PKR {officer.pending_cash > 0 ? officer.pending_cash.toLocaleString() : '0'}
                            </p>
                        </div>
                        <div className="p-3 bg-white dark:bg-boxdark rounded-xl shadow-sm text-orange-500">
                            <Banknote size={20} />
                        </div>
                    </div>

                    <div className="p-4 bg-orange-500/[0.03] dark:bg-orange-500/5 rounded-2xl border border-orange-500/10 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Collection</p>
                            <p className="text-sm font-black text-gray-800 dark:text-white tabular-nums">PKR {officer.total_collection?.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-1">Paid to Outlet</p>
                            <p className="text-sm font-black text-green-600 tabular-nums">PKR {officer.paid_cash?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-stroke dark:border-strokedark flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Successful Collections</p>
                        <p className="text-sm font-black text-gray-800 dark:text-gray-200">
                             {officer.orders.delivered} <span className="text-gray-400 font-medium lowercase">received</span>
                        </p>
                    </div>
                    <button 
                        onClick={onClick}
                        className="w-12 h-12 bg-gray-100 dark:bg-meta-4 rounded-2xl flex items-center justify-center text-gray-500 hover:bg-orange-500 hover:text-white transition-all shadow-inner group/btn"
                    >
                        <Eye size={20} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-white dark:bg-boxdark p-20 rounded-[2.5rem] border border-stroke dark:border-strokedark text-center shadow-xl shadow-gray-100 dark:shadow-none">
            <div className="w-20 h-20 bg-gray-50 dark:bg-meta-4 rounded-full flex items-center justify-center mx-auto mb-6">
                <User size={40} className="text-gray-200" />
            </div>
            <h3 className="font-black text-2xl text-gray-800 dark:text-white uppercase tracking-tight">No Recovery Officers</h3>
            <p className="text-sm text-gray-400 mt-2 font-bold max-w-sm mx-auto">There are no recovery officers assigned to this outlet in the system.</p>
        </div>
    );
}
