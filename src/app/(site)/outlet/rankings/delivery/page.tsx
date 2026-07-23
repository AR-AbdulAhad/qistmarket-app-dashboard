"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { Truck, TrendingUp, TrendingDown, Minus, RefreshCw, Store, Filter } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const authHeaders = () => ({ Authorization: `Bearer ${Cookies.get("auth_token")}`, "Content-Type": "application/json" });

function TrendIcon({ trend }: { trend: number }) {
    if (trend > 0) return <TrendingUp size={14} className="text-green-500" />;
    if (trend < 0) return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-gray-400" />;
}

const tierBadge: Record<string, string> = {
    Gold: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    Silver: "bg-slate-100 text-slate-700 border border-slate-200",
    Bronze: "bg-orange-100 text-orange-700 border border-orange-200",
};

export default function DeliveryOfficerRankingsPage() {
    const [officers, setOfficers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [outlets, setOutlets] = useState<any[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<string>("all");
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchRankings = async () => {
        setLoading(true);
        try {
            const userRes = await fetch(`${BACKEND_URL}/api/user/me`, { headers: authHeaders() });
            const userData = await userRes.json();
            if (userData.success) setCurrentUser(userData.data);
            const res = await fetch(`${BACKEND_URL}/api/admin-panel/rankings`, { headers: authHeaders() });
            const data = await res.json();
            if (data.success) {
                const deliveryData = data.data?.delivery || [];
                setOfficers(deliveryData);
                const uniqueOutlets = [...new Map(
                    deliveryData
                        .filter((o: any) => o.outlet_id)
                        .map((o: any) => [o.outlet_id, { id: o.outlet_id, name: o.outlet_name }])
                ).values()];
                setOutlets(uniqueOutlets as any[]);
            } else {
                toast.error(data.message || "Failed to load rankings");
            }
        } catch {
            toast.error("Failed to load rankings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRankings(); }, []);

    const filtered = selectedOutlet === "all"
        ? officers
        : officers.filter((o) => String(o.outlet_id) === selectedOutlet);

    return (
        <>
            <Breadcrumb pageName="Delivery Officer Rankings" />
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3">
                            <div className="p-2.5 bg-green-500/10 rounded-2xl text-green-500"><Truck size={28} /></div>
                            Delivery Officer Rankings
                        </h1>
                        <p className="text-sm text-gray-400 mt-2 font-bold">Global and per-outlet delivery officer performance — current month</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-2xl px-4 py-2.5">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={selectedOutlet}
                                onChange={(e) => setSelectedOutlet(e.target.value)}
                                className="text-sm font-bold bg-transparent outline-none text-gray-700 dark:text-gray-200"
                            >
                                <option value="all">All Outlets</option>
                                {outlets.map((o: any) => (
                                    <option key={o.id} value={String(o.id)}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={fetchRankings} className="flex items-center gap-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all">
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="h-20 bg-gray-100 dark:bg-meta-4 rounded-[1.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-24 text-center">
                        <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-xl font-bold text-gray-500">No delivery officers ranked yet</p>
                        <p className="text-sm text-gray-400 mt-2">Rankings are computed from current month activity.</p>
                    </div>
                ) : (
                    <div className="rounded-[2rem] border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-stroke dark:border-strokedark bg-green-50/50 dark:bg-green-500/5 flex items-center justify-between">
                            <p className="text-sm font-black uppercase tracking-widest text-green-600 flex items-center gap-2">
                                <Truck size={16} /> {filtered.length} Officers Ranked
                            </p>
                            {selectedOutlet !== "all" && (
                                <p className="text-xs font-bold text-gray-400">
                                    Outlet Filter: <span className="text-gray-800 dark:text-white">{outlets.find((o: any) => String(o.id) === selectedOutlet)?.name}</span>
                                </p>
                            )}
                        </div>
                        <div className="divide-y divide-stroke dark:divide-strokedark">
                            {filtered.map((officer) => (
                                <div key={officer.id} className="flex items-center gap-6 p-6 hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors">
                                    {/* Rank badge */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0 ${
                                        officer.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                                        officer.rank === 2 ? "bg-slate-100 text-slate-700" :
                                        officer.rank === 3 ? "bg-orange-100 text-orange-700" :
                                        "bg-gray-100 text-gray-500"
                                    }`}>
                                        {officer.rank === 1 ? "🥇" : officer.rank === 2 ? "🥈" : officer.rank === 3 ? "🥉" : `#${officer.rank}`}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 text-xl font-black flex-shrink-0">
                                        {officer.full_name?.charAt(0)?.toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-base font-black text-gray-800 dark:text-white truncate">
                                                {officer.full_name}
                                                {currentUser?.id === officer.officer_id
                                                    ? <span className="ml-2 text-sm text-green-500">(You)</span>
                                                    : currentUser?.outlet_id === officer.outlet_id
                                                    ? <span className="ml-2 text-xs font-bold text-gray-400">(Your Team)</span>
                                                    : null}
                                            </p>
                                            {officer.tier && (
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${tierBadge[officer.tier] || ''}`}>{officer.tier}</span>
                                            )}
                                            <span className="flex items-center gap-1"><TrendIcon trend={officer.trend ?? 0} /></span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                            <span className="flex items-center gap-1"><Store size={12} />{officer.outlet_name}</span>
                                            <span>@{officer.username}</span>
                                        </div>
                                    </div>

                                    {/* KPIs */}
                                    <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Score</p>
                                            <p className="text-xl font-black text-green-600">{officer.score}</p>
                                        </div>
                                        {officer.successful_deliveries != null && (
                                            <div className="text-center">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-0.5">Delivered</p>
                                                <p className="text-base font-black text-green-600">{officer.successful_deliveries}</p>
                                            </div>
                                        )}
                                        {officer.failed_deliveries != null && (
                                            <div className="text-center">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-0.5">Failed</p>
                                                <p className="text-base font-black text-red-500">{officer.failed_deliveries}</p>
                                            </div>
                                        )}
                                        {officer.avg_delivery_minutes != null && (
                                            <div className="text-center">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Avg Time</p>
                                                <p className="text-base font-black text-gray-800 dark:text-white">{officer.avg_delivery_minutes}m</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
