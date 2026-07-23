"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { 
    Users, Target, Calendar, CheckCircle2, Search, Filter 
} from "lucide-react";
import Loader from "@/components/common/Loader";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface Officer {
    id: number;
    username: string;
    full_name: string;
}

export default function OfficerTargetsPage() {
    const [loading, setLoading] = useState(true);
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [officerType, setOfficerType] = useState<"verification" | "delivery" | "recovery">("recovery");
    const [targets, setTargets] = useState<any[]>([]);
    
    // Assignment form state
    const [selectedOfficer, setSelectedOfficer] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [targetType, setTargetType] = useState<"amount" | "customers">("amount");
    const [targetValue, setTargetValue] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${Cookies.get("auth_token")}`,
        "Content-Type": "application/json",
    });

    const fetchOfficers = async () => {
        const roleMap: Record<string, number> = {
            verification: 1,
            delivery: 2,
            recovery: 3
        };
        const roleId = roleMap[officerType];

        try {
            const res = await fetch(`${API_BASE}/api/outlet/team/list?role_id=${roleId}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setOfficers(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch officers", err);
        }
    };

    const fetchTargets = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/targets/officer?month=${selectedMonth}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setTargets(data.targets || []);
            }
        } catch (err) {
            console.error("Failed to fetch targets", err);
        }
    };

    useEffect(() => {
        fetchOfficers();
    }, [officerType]);

    useEffect(() => {
        const loadInitial = async () => {
            setLoading(true);
            await Promise.all([fetchOfficers(), fetchTargets()]);
            setLoading(false);
        };
        loadInitial();
    }, [selectedMonth]);

    const handleAssignTarget = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedOfficer || !targetValue) {
            toast.error("Please select an officer and enter a target value.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/targets/officer`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    officer_id: selectedOfficer,
                    month: selectedMonth,
                    target_type: targetType,
                    target_value: targetValue
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchTargets();
                setTargetValue("");
            } else {
                toast.error(data.message || "Failed to assign target");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loader text="Loading Officer Targets..." />;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Officer Targets" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Assignment Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-stroke dark:border-strokedark p-6">
                        <h2 className="text-lg font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <Target size={20} className="text-primary" /> Assign Monthly Target
                        </h2>
                        
                        <form onSubmit={handleAssignTarget} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Target Month</label>
                                <input 
                                    type="month" 
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Officer Type</label>
                                <select 
                                    value={officerType}
                                    onChange={(e) => {
                                        setOfficerType(e.target.value as any);
                                        setSelectedOfficer("");
                                    }}
                                    className="w-full bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="recovery">Recovery Officers</option>
                                    <option value="delivery">Delivery Officers</option>
                                    <option value="verification">Verification Officers</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Select Officer</label>
                                <select 
                                    value={selectedOfficer}
                                    onChange={(e) => setSelectedOfficer(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="">-- Choose Officer --</option>
                                    {officers.map(off => (
                                        <option key={off.id} value={off.id}>{off.full_name || off.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Target Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${targetType === 'amount' ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-strokedark hover:border-gray-300'}`}>
                                        <input type="radio" name="targetType" className="sr-only" checked={targetType === 'amount'} onChange={() => setTargetType('amount')} />
                                        <span className={`text-sm font-bold ${targetType === 'amount' ? 'text-primary' : 'text-gray-500'}`}>Amount (PKR)</span>
                                    </label>
                                    <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${targetType === 'customers' ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-strokedark hover:border-gray-300'}`}>
                                        <input type="radio" name="targetType" className="sr-only" checked={targetType === 'customers'} onChange={() => setTargetType('customers')} />
                                        <span className={`text-sm font-bold ${targetType === 'customers' ? 'text-primary' : 'text-gray-500'}`}>Customers (Qty)</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Target Value</label>
                                <input 
                                    type="number" 
                                    required
                                    min="1"
                                    value={targetValue}
                                    onChange={(e) => setTargetValue(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    placeholder={targetType === 'amount' ? "e.g. 500000" : "e.g. 50"}
                                />
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full py-3 rounded-xl bg-primary text-white font-black text-sm hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Assigning...' : 'Lock In Target'}
                                </button>
                                <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                                    <CheckCircle2 size={12} className="text-green-500" /> Targets cannot be modified once set.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Target List */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden">
                        <div className="p-6 border-b border-stroke dark:border-strokedark flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                                <Users size={20} className="text-blue-500" /> Assigned Targets ({selectedMonth})
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-meta-4 text-gray-500 text-xs font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4">Officer Name</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Target Type</th>
                                        <th className="p-4 text-right">Target Value</th>
                                        <th className="p-4 text-right">Assigned By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {targets.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500 text-sm font-bold">
                                                No targets assigned for this month yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        targets.map((t, idx) => (
                                            <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors">
                                                <td className="p-4 text-sm font-bold text-gray-800 dark:text-white">{t.officer?.full_name || t.officer?.username}</td>
                                                <td className="p-4">
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 rounded-md font-bold">
                                                        {t.officer?.role?.name || 'Officer'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-500 capitalize">{t.target_type}</td>
                                                <td className="p-4 text-right font-black text-primary">
                                                    {t.target_type === 'amount' 
                                                        ? `PKR ${t.target_value.toLocaleString()}` 
                                                        : `${t.target_value} Customers`}
                                                </td>
                                                <td className="p-4 text-right text-xs text-gray-400 font-bold">
                                                    {t.created_by?.full_name || t.created_by?.username}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
