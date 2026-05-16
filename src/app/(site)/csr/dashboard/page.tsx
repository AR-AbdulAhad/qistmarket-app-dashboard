"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import RankingBoard from "@/components/CSR/RankingBoard";
import dynamic from 'next/dynamic';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Users, 
  CheckCircle2, 
  Clock, 
  Percent,
  Award,
  Zap,
  Filter,
  PhoneCall,
  MessageCircle,
  Globe,
  Share2,
  XCircle,
  AlertCircle,
  Wallet,
  BadgeDollarSign,
  ChevronRight,
  Trophy,
  Activity
} from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChannelStat {
  total: number;
  delivered: number;
  cancelled: number;
  successRate: number;
  cancelRate: number;
}

interface CsrRanking {
  rank: number;
  userId: number;
  name: string;
  username: string;
  image?: string;
  uniqueCustomers: number;
  delivered: number;
  repeatCustomers: number;
  cancelled: number;
  expired: number;
  totalSales: number;
  score: number;
  trend: number;
  successRate: number;
  cancelRate: number;
  league?: string;
  complaintsSolved: number;
  complaintsPending: number;
  outletName?: string;
}

interface CsrDashboardStats {
  filter: string;
  dateRange: { start: string; end: string };
  isCsr: boolean;
  totalOrders: number;
  statusCounts: {
    delivered: number;
    completed: number;
    cancelled: number;
    expired: number;
    in_progress: number;
    new: number;
    pending: number;
    approved: number;
    picked: number;
    rejected: number;
  };
  todayIncrement: {
    total: number;
    new: number;
    pending: number;
    delivered: number;
    approved: number;
    cancelled: number;
    expired: number;
    sales: number;
  };
  channelStats: {
    referral: ChannelStat;
    call: ChannelStat;
    whatsapp: ChannelStat;
    website: ChannelStat;
  };
  successRate: number;
  cancelRate: number;
  targetTracking: {
    monthlyTarget: number;
    achievedAmount: number;
    remainingAmount: number;
    achievedCustomers: number;
    customerTarget: number;
    remainingCustomers: number;
    dailyAvgRequired: number;
    currentDailyAvg: number;
    remainingDays: number;
    progressPct: number;
    avgTicketSize: number;
    avgTicketIncrement: number;
    successRateIncrement: number;
    overallTodayIncrement: number;
  };
  graphData: {
    days: number[];
    sales: { current: number[]; previous: number[] };
    customers: { current: number[]; previous: number[] };
  };
  outletPerformance: Array<{
    id: number;
    name: string;
    total: number;
    delivered: number;
    successRate: number;
  }>;
  csrRanking: CsrRanking[];
}

export default function CsrDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CsrDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<"today" | "month" | "custom">("month");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!authLoading && user) {
      const userRole = user.role?.toLowerCase();
      if (userRole === "outlet") {
        router.push("/outlet/dashboard");
      }
    }
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      const query = new URLSearchParams({ filter: filterType });
      if (filterType === "custom") {
        if (startDate) query.append("startDate", startDate);
        if (endDate) query.append("endDate", endDate);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/csr-dashboard-stats?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (error) {
      console.error("Failed to load CSR dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterType]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(val);
  };

  const renderTopCards = () => {
    if (!stats) return null;
    const { statusCounts, totalOrders, todayIncrement, targetTracking } = stats;
    
    const cards = [
      { label: "Total Orders", value: totalOrders, inc: todayIncrement.total, color: "text-[#E31E24]", bg: "bg-red-50", icon: <ShoppingBag size={18} />, href: "/all-orders" },
      { label: "Pending", value: statusCounts.pending || 0, inc: todayIncrement.pending, color: "text-amber-600", bg: "bg-amber-50", icon: <Clock size={18} />, href: "/pending-orders" },
      { label: "In Progress", value: statusCounts.in_progress || 0, inc: 0, color: "text-blue-600", bg: "bg-blue-50", icon: <Activity size={18} />, href: "/in-progress-orders" },
      { label: "Approved", value: statusCounts.approved || 0, inc: todayIncrement.approved, color: "text-indigo-600", bg: "bg-indigo-50", icon: <CheckCircle2 size={18} />, href: "/approved-orders" },
      { label: "Picked", value: statusCounts.picked || 0, inc: 0, color: "text-teal-600", bg: "bg-teal-50", icon: <ShoppingBag size={18} />, href: "/picked-orders" },
      { label: "Completed", value: statusCounts.completed || 0, inc: 0, color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 size={18} />, href: "/completed-orders" },
      { label: "Delivered", value: statusCounts.delivered || 0, inc: todayIncrement.delivered, color: "text-emerald-600", bg: "bg-emerald-50", icon: <Award size={18} />, href: "/delivered-orders" },
      { label: "Cancelled", value: statusCounts.cancelled || 0, inc: todayIncrement.cancelled, color: "text-rose-600", bg: "bg-rose-50", icon: <XCircle size={18} />, href: "/cancelled-orders" },
      { label: "Rejected", value: statusCounts.rejected || 0, inc: 0, color: "text-red-600", bg: "bg-red-50", icon: <AlertCircle size={18} />, href: "/rejected-orders" },
      { label: "Expired", value: statusCounts.expired || 0, inc: todayIncrement.expired, color: "text-orange-600", bg: "bg-orange-50", icon: <AlertCircle size={18} />, href: "/expired-orders" },
      { label: "Total Sales", value: `PKR ${formatCurrency(targetTracking.achievedAmount)}`, inc: todayIncrement.sales, color: "text-[#E31E24]", bg: "bg-red-50/50", icon: <Wallet size={18} />, href: null },
      { label: "Success Rate", value: `${stats.successRate}%`, inc: targetTracking.successRateIncrement, color: "text-emerald-600", bg: "bg-emerald-50/50", icon: <Percent size={18} />, href: null },
      { label: "Avg Sale Per Customer", value: `PKR ${formatCurrency(targetTracking.avgTicketSize)}`, inc: targetTracking.avgTicketIncrement, color: "text-[#E31E24]", bg: "bg-red-50/50", icon: <BadgeDollarSign size={18} />, href: null },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-8 w-full">
        {cards.map((card, i) => (
          <div 
            key={card.label} 
            onClick={() => card.href ? router.push(card.href) : null}
            className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-${(i+1)*2} ${card.href ? 'cursor-pointer hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5' : ''}`}
          >
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>{card.icon}</div>
                <h4 className="text-[8px] font-black uppercase tracking-wider text-gray-400 truncate">{card.label}</h4>
            </div>
            <div className="flex flex-col gap-1">
                <h2 className="text-sm font-black text-gray-800">{card.value}</h2>
                <div className={`flex items-center gap-1 text-[10px] font-black ${card.inc >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {card.inc >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(card.inc)}%
                </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSidebars = () => {
    if (!stats) return null;
    const { targetTracking, csrRanking, outletPerformance } = stats;
    const userRank = csrRanking.find(r => r.userId === user?.id) || csrRanking[0];
    const topPerformer = csrRanking[0];


    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">My Performance</h3>
                    <div className="px-3 py-1 bg-red-50 text-[#E31E24] rounded-full text-[8px] font-black uppercase">Live</div>
                </div>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Global Rank</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-gray-800">{userRank.rank}</span>
                            <span className="text-xs font-black text-gray-300">/{csrRanking.length}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="p-3 bg-yellow-50 rounded-2xl"><Award className="text-yellow-500" size={24} /></div>
                        <span className="text-[9px] font-black text-yellow-600 uppercase mt-1 block">{userRank.league || 'Gold'}</span>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Achievement Progress</p>
                            <p className="text-lg font-black text-gray-800">{userRank.delivered} <span className="text-gray-300 font-bold">/ {targetTracking.customerTarget}</span></p>
                        </div>
                        <div className="relative size-12 flex items-center justify-center">
                            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                                <path className="text-[#E31E24]" strokeDasharray={`${userRank.successRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                            <span className="text-[10px] font-black text-gray-800">{userRank.successRate}%</span>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-gray-50 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Complaints Solved</span>
                            <span className="text-xs font-black text-emerald-600">{userRank.complaintsSolved}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Complaints Pending</span>
                            <span className="text-xs font-black text-amber-600">{userRank.complaintsPending}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Sales</span>
                            <span className="text-xs font-black text-gray-800">PKR {formatCurrency(userRank.totalSales)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Score</span>
                            <span className="text-xl font-black text-[#E31E24]">{userRank.score.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-right-5 duration-700">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Outlet Tracking</h3>
                <div className="space-y-5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {outletPerformance.map((outlet) => (
                        <div key={outlet.id} className="space-y-2">
                            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-700 uppercase">{outlet.name}</span><span className="text-[10px] font-black text-[#E31E24]">{outlet.successRate}%</span></div>
                            <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-[#E31E24] rounded-full" style={{ width: `${outlet.successRate}%` }}></div></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 py-[45px] shadow-2xl shadow-gray-200/40 relative overflow-hidden animate-in fade-in slide-in-from-right-6 duration-700 shrink-0">
                <div className="absolute top-0 right-0 p-4 text-red-500/5"><Trophy size={100} /></div>
                <h3 className="text-[10px] font-black text-[#E31E24] uppercase tracking-widest mb-8 text-center">Top Ranking CSR</h3>
                <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="relative group">
                        <div className="h-20 w-20 rounded-3xl border-2 border-red-50 overflow-hidden bg-gray-50 shadow-lg">
                            {topPerformer.image ? <img src={topPerformer.image} alt="" className="h-full w-full object-cover" /> : <Users className="text-gray-200 m-auto mt-5" size={32} />}
                        </div>
                        <div className="absolute -top-1 -left-1 bg-[#E31E24] text-white rounded-xl h-8 w-8 flex items-center justify-center font-black text-xs">1</div>
                    </div>
                    <div className="text-center"><h4 className="text-lg font-black text-gray-800 tracking-tight">{topPerformer.name}</h4><p className="text-[9px] font-black text-[#E31E24] uppercase mt-1">{topPerformer.outletName || 'Main'}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-y-6 pt-6 border-t border-gray-50 text-center">
                    <div><p className="text-[9px] font-black text-gray-400 uppercase">Achievement</p><p className="text-sm font-black text-gray-800">{Math.round((topPerformer.delivered / 120) * 100)}%</p></div>
                    <div><p className="text-[9px] font-black text-gray-400 uppercase">Sales</p><p className="text-sm font-black text-gray-800">{formatCurrency(topPerformer.totalSales)}</p></div>
                </div>
            </div>
        </div>
    );
  };

  const renderMiddle = () => {
    if (!stats) return null;
    const { csrRanking, targetTracking } = stats;

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="w-full overflow-hidden shrink-0">
                <RankingBoard rankings={csrRanking.map(r => ({ ...r, target: targetTracking.customerTarget }))} currentUserId={user?.id} />
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h4 className="text-[14px] font-black text-gray-800 uppercase tracking-tight">Complaint Resolution Ranking</h4>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Efficiency in solving customer issues</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <MessageCircle size={24} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...csrRanking].sort((a,b) => b.complaintsSolved - a.complaintsSolved).slice(0, 4).map((csr, i) => (
                        <div key={csr.userId} className="relative group p-6 rounded-3xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="absolute -top-3 -right-3 h-8 w-8 bg-[#E31E24] text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg">#{i+1}</div>
                            <div className="flex flex-col items-center text-center">
                                <div className="h-16 w-16 rounded-2xl overflow-hidden mb-4 border-2 border-white shadow-md bg-white">
                                    {csr.image ? <img src={csr.image} className="h-full w-full object-cover" /> : <Users className="text-gray-200 m-auto mt-4" size={24} />}
                                </div>
                                <h5 className="text-sm font-black text-gray-800 truncate w-full">{csr.name}</h5>
                                <p className="text-[8px] font-bold text-gray-400 uppercase mb-4 truncate w-full">{csr.outletName}</p>
                                
                                <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-[8px] font-black text-emerald-600 uppercase">Solved</p>
                                        <p className="text-lg font-black text-gray-800">{csr.complaintsSolved}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-amber-600 uppercase">Pending</p>
                                        <p className="text-lg font-black text-gray-800">{csr.complaintsPending}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  const renderRight = () => {
    if (!stats) return null;
    const { statusCounts, totalOrders, channelStats, targetTracking } = stats;

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Performance Funnel */}
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-right-4 duration-700">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Performance Funnel</h3>
                <div className="space-y-4">
                    {[
                        { label: "Total Influx Leads", value: totalOrders, color: 'bg-red-600' },
                        { label: "Pending Verification", value: statusCounts.pending, color: 'bg-amber-500' },
                        { label: "Approved Operations", value: statusCounts.approved, color: 'bg-indigo-600' },
                        { label: "Delivered (Done Customer)", value: statusCounts.delivered, color: 'bg-emerald-600' },
                    ].map((step, i) => (
                        <div key={step.label} className="space-y-3">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-tight">{step.label}</p>
                                <p className="text-base font-black text-gray-800">{step.value.toLocaleString()}</p>
                            </div>
                            <div className="h-8 w-full bg-gray-50 rounded-2xl overflow-hidden shadow-inner border border-gray-100/50">
                                <div className={`h-full ${step.color} shadow-lg transition-all duration-1000 flex items-center justify-end px-3`} style={{ width: `${Math.max(15, 100 - (i * 15))}%` }}>
                                    <ChevronRight className="text-white/30" size={14} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-left-6 duration-700">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Target Stats</h3>
                <div className="space-y-5">
                    {[
                        { label: "Working Days Left", value: targetTracking.remainingDays, icon: <Clock size={14} className="text-gray-300" /> },
                        { label: "Required Daily Avg", value: targetTracking.dailyAvgRequired, icon: <Zap size={14} className="text-[#E31E24]" /> },
                        { label: "Current Daily Avg", value: targetTracking.currentDailyAvg, icon: <Activity size={14} className="text-emerald-500" /> },
                        { label: "Pending Target", value: targetTracking.remainingCustomers, color: 'text-rose-500', icon: <Users size={14} className="text-rose-300" /> },
                    ].map(item => (
                        <div key={item.label} className="flex justify-between items-center group">
                            <div className="flex items-center gap-3">{item.icon}<span className="text-[9px] font-black text-gray-400 uppercase group-hover:text-gray-600">{item.label}</span></div>
                            <span className={`text-sm font-black ${item.color || 'text-gray-800'}`}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>


            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-right-8 duration-700">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Success Channels</h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "Web", data: channelStats.website, icon: <Globe size={14} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: "WhatsApp", data: channelStats.whatsapp, icon: <MessageCircle size={14} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: "Referral", data: channelStats.referral, icon: <Share2 size={14} />, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: "Call", data: channelStats.call, icon: <PhoneCall size={14} />, color: 'text-rose-500', bg: 'bg-rose-50' },
                    ].map(ch => (
                        <div key={ch.label} className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-gray-50/50 border border-gray-100/50">
                            <div className={`p-1.5 rounded-lg ${ch.bg} ${ch.color}`}>{ch.icon}</div>
                            <p className="text-[7px] font-black text-gray-400 uppercase">{ch.label}</p>
                            <p className="text-[10px] font-black text-gray-800">{ch.data.successRate}%</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  
  const chartOptions: any = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, easing: 'easeinout', speed: 1200 } },
    stroke: { curve: 'smooth', width: 3, colors: ['#E31E24', '#94A3B8'] },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
    xaxis: { categories: stats?.graphData?.days || [], labels: { style: { colors: '#94A3B8', fontSize: '9px', fontWeight: 800 } }, axisBorder: { show: false } },
    yaxis: { labels: { style: { colors: '#94A3B8', fontSize: '9px', fontWeight: 800 }, formatter: (v: any) => v ? `${(Number(v)/1000).toFixed(0)}k` : '0' } },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 5 },
    legend: { show: false },
    colors: ['#E31E24', '#94A3B8'],
    tooltip: { theme: 'light', x: { show: false }, marker: { show: true } }
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 min-h-screen animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-8 border-b border-slate-200 pb-8">
        <div>
            <div className="flex items-center gap-3">
                <div className="p-3 bg-[#E31E24] rounded-2xl shadow-lg shadow-red-200"><Activity className="text-white" size={24} /></div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">CSR ANALYTICS DASHBOARD</h1>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 ml-1">Real-time Performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20">
          {["today", "month", "custom"].map((type) => (
            <button key={type} onClick={() => setFilterType(type as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${filterType === type ? "bg-[#E31E24] text-white shadow-xl shadow-red-200 scale-105" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}>{type}</button>
          ))}
          {filterType === "custom" && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100 ml-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-500 uppercase cursor-pointer" />
                <span className="text-slate-200 font-black">/</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-500 uppercase cursor-pointer" />
                <button onClick={fetchStats} className="h-10 w-10 bg-[#E31E24] text-white rounded-xl shadow-lg shadow-red-200 flex items-center justify-center hover:scale-110"><Filter size={18} /></button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-[40rem] items-center justify-center rounded-[3rem] bg-white border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center">
             <div className="relative size-20"><div className="absolute inset-0 rounded-full border-4 border-red-50 border-t-[#E31E24] animate-spin"></div></div>
             <p className="mt-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Syncing Data Streams</p>
          </div>
        </div>
      ) : stats ? (
        <>
        <div className="flex flex-col gap-6 w-full">
            {renderTopCards()}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
                <div className="xl:col-span-3 flex flex-col gap-6">{renderSidebars()}</div>
                <div className="xl:col-span-6 flex flex-col gap-6 overflow-hidden">{renderMiddle()}</div>
                <div className="xl:col-span-3 flex flex-col gap-6">{renderRight()}</div>
            </div>
        </div>
        <div className="flex gap-6 mt-[24px]">
        <div className="flex gap-6 w-full lg:flex-row flex-col">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40 w-full">
              <div className="flex justify-between items-center mb-8">
                  <div><h4 className="text-[12px] font-black text-gray-800 uppercase tracking-tight">Revenue Analytics</h4><p className="text-[9px] font-bold text-gray-400">Monthly Performance</p></div>
                  <div className="flex gap-4"><div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-[#E31E24]"></div><span className="text-[10px] font-black text-gray-500 uppercase">Now</span></div></div>
              </div>
              <Chart options={chartOptions} series={[{name: 'Current', data: stats.graphData.sales.current}, {name: 'Previous', data: stats.graphData.sales.previous}]} type="area" height={320} />
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40 w-full">
              <div className="flex justify-between items-center mb-8">
                  <div><h4 className="text-[12px] font-black text-gray-800 uppercase tracking-tight">Conversion Velocity</h4><p className="text-[9px] font-bold text-gray-400">Successful Deliveries</p></div>
                  <div className="flex gap-4"><div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black text-gray-500 uppercase">Now</span></div></div>
              </div>
              <Chart options={{...chartOptions, stroke: { ...chartOptions.stroke, colors: ['#10B981', '#6366F1'] }, colors: ['#10B981', '#6366F1']}} series={[{name: 'Current', data: stats.graphData.customers.current}, {name: 'Previous', data: stats.graphData.customers.previous}]} type="area" height={320} />
          </div>
          </div>
        </div>
        </>
      ) : null}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
