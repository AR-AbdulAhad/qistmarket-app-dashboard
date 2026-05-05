"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";

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
    remaining: number;
    achievedCustomers: number;
    customerTarget: number;
    dailyAvgRequired: number;
    progressPct: number;
  };
  csrRanking: CsrRanking[];
}

interface ChannelStat {
  total: number;
  delivered: number;
  cancelled: number;
  successRate: number;
  cancelRate: number;
}

interface CsrRanking {
  userId: number;
  name: string;
  username: string;
  totalOrders: number;
  delivered: number;
  cancelled: number;
  achievedAmount: number;
  successRate: number;
}

export default function CsrDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CsrDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<"today" | "month" | "custom">("today");
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]); // Auto-fetch when preset changes, manual button for custom

  const renderStatusCards = () => {
    if (!stats) return null;
    const { statusCounts, totalOrders } = stats;
    
    const cards = [
      { label: "Orders in Range", value: totalOrders, color: "bg-blue-500", icon: "📦" },
      { label: "Delivered", value: statusCounts.delivered, color: "bg-green-500", icon: "✅" },
      { label: "Completed", value: statusCounts.completed, color: "bg-teal-500", icon: "🏆" },
      { label: "Cancelled", value: statusCounts.cancelled, color: "bg-red-500", icon: "❌" },
      { label: "Expired", value: statusCounts.expired, color: "bg-orange-500", icon: "⏳" },
      { label: "In-Progress", value: statusCounts.in_progress, color: "bg-indigo-500", icon: "⚙️" },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-stroke bg-white p-5 shadow-default transition-all hover:shadow-md dark:border-dark-3 dark:bg-boxdark">
            <div className="flex items-center justify-between mb-3">
              <div className={`flex items-center justify-center size-10 rounded-full ${card.color} text-white shadow-sm text-lg bg-opacity-90`}>
                {card.icon}
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white">{card.value}</h2>
            </div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</h4>
          </div>
        ))}
      </div>
    );
  };

  const renderChannelCards = () => {
    if (!stats) return null;
    const { channelStats } = stats;

    const channels = [
      { key: "referral", label: "Referral", data: channelStats.referral, icon: "🤝" },
      { key: "call", label: "Call", data: channelStats.call, icon: "📞" },
      { key: "whatsapp", label: "WhatsApp", data: channelStats.whatsapp, icon: "💬" },
      { key: "website", label: "Website", data: channelStats.website, icon: "🌐" },
    ];

    return (
      <div className="mb-6">
        <h3 className="text-lg font-bold text-black dark:text-white mb-4">Channel Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map(({ key, label, data, icon }) => (
            <div key={key} className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-dark-3 dark:bg-boxdark">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <h4 className="font-semibold text-gray-800 dark:text-white">{label}</h4>
                </div>
                <span className="font-bold text-lg bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-black dark:text-white">
                  {data.total}
                </span>
              </div>
              
              <div className="space-y-3 mt-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Success Rate</span>
                    <span className="font-semibold text-green-600">{data.successRate}%</span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${data.successRate}%` }}></div>
                 </div>

                 <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-gray-500 dark:text-gray-400">Cancel Rate</span>
                    <span className="font-semibold text-red-500">{data.cancelRate}%</span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${data.cancelRate}%` }}></div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTargetTracking = () => {
    if (!stats) return null;
    const { targetTracking, successRate, cancelRate } = stats;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Overall Success Metrics */}
        <div className="col-span-1 lg:col-span-4 rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-boxdark">
          <h3 className="text-lg font-bold text-black dark:text-white mb-6">Overall Success</h3>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative size-32 flex items-center justify-center rounded-full border-8 border-gray-100 dark:border-gray-800">
              <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-green-500"
                  strokeDasharray={`${successRate}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor" strokeWidth="4"
                />
              </svg>
              <div className="text-center">
                <span className="text-3xl font-bold text-black dark:text-white">{successRate}%</span>
                <p className="text-xs text-gray-500 uppercase font-semibold">Success</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-stroke dark:border-dark-3 pt-4">
             <div className="text-center">
               <p className="text-xs text-gray-500 uppercase font-semibold">Cancel Rate</p>
               <p className="text-lg font-bold text-red-500">{cancelRate}%</p>
             </div>
             <div className="w-px h-8 bg-stroke dark:bg-dark-3"></div>
             <div className="text-center">
               <p className="text-xs text-gray-500 uppercase font-semibold">Delivered</p>
               <p className="text-lg font-bold text-green-500">{stats.statusCounts.delivered}</p>
             </div>
          </div>
        </div>

        {/* Target Tracking */}
        <div className="col-span-1 lg:col-span-8 rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-boxdark">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-black dark:text-white">Target Tracking (Advance)</h3>
             <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">{filterType === 'month' ? 'This Month' : filterType === 'today' ? 'Today' : 'Custom Range'}</span>
          </div>

          <div className="mb-6">
             <div className="flex justify-between items-end mb-2">
                <div>
                   <p className="text-sm font-semibold text-gray-500">Achieved</p>
                   <p className="text-2xl font-bold text-green-600">Rs {targetTracking.achievedAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                   <p className="text-sm font-semibold text-gray-500">Target</p>
                   <p className="text-xl font-bold text-black dark:text-white">Rs {targetTracking.monthlyTarget.toLocaleString()}</p>
                </div>
             </div>
             <div className="w-full bg-gray-100 rounded-full h-3 dark:bg-gray-800 relative overflow-hidden">
                <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${targetTracking.progressPct}%` }}></div>
             </div>
             <p className="text-right text-xs font-bold text-gray-500 mt-1">{targetTracking.progressPct}% Completed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-stroke dark:border-dark-3 pt-6">
             <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Remaining Target</p>
                <p className="text-lg font-bold text-orange-500">Rs {targetTracking.remaining.toLocaleString()}</p>
             </div>
             <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Daily Avg Required</p>
                <p className="text-lg font-bold text-blue-500">Rs {targetTracking.dailyAvgRequired.toLocaleString()}</p>
             </div>
             <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Customers Target</p>
                <div className="flex items-baseline gap-1">
                   <p className="text-lg font-bold text-black dark:text-white">{targetTracking.achievedCustomers}</p>
                   <p className="text-sm text-gray-500">/ {targetTracking.customerTarget > 0 ? targetTracking.customerTarget : 'Not Set'}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRankingBoard = () => {
    if (!stats || stats.isCsr || !stats.csrRanking || stats.csrRanking.length === 0) return null;

    return (
      <div className="rounded-xl border border-stroke bg-white shadow-sm dark:border-dark-3 dark:bg-boxdark mb-10 overflow-hidden">
        <div className="px-6 py-5 border-b border-stroke dark:border-dark-3 bg-gray-50 dark:bg-gray-800/30">
          <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <span>🏆</span> CSR Ranking Board
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-stroke dark:border-dark-3">
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">CSR Name</th>
                <th className="px-6 py-4 font-semibold">Orders</th>
                <th className="px-6 py-4 font-semibold">Delivered</th>
                <th className="px-6 py-4 font-semibold">Success %</th>
                <th className="px-6 py-4 font-semibold text-right">Advance Achieved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-dark-3">
              {stats.csrRanking.map((rank, index) => (
                <tr key={rank.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-gray-200 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-black dark:text-white">{rank.name}</p>
                    <p className="text-xs text-gray-500">@{rank.username}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{rank.totalOrders}</td>
                  <td className="px-6 py-4 font-medium text-green-600">{rank.delivered}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black dark:text-white">{rank.successRate}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${rank.successRate}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-right text-black dark:text-white">
                    Rs {rank.achievedAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <Breadcrumb pageName="CSR Analytics Dashboard" />
        
        {/* Advanced Filters */}
        <div className="flex items-center gap-2 bg-white dark:bg-boxdark p-1.5 rounded-lg border border-stroke dark:border-dark-3 shadow-sm mt-4 sm:mt-0">
          <button
            onClick={() => setFilterType("today")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${filterType === "today" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          >
            Today
          </button>
          <button
            onClick={() => setFilterType("month")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${filterType === "month" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          >
            This Month
          </button>
          <button
            onClick={() => setFilterType("custom")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${filterType === "custom" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {filterType === "custom" && (
        <div className="flex items-end gap-3 mb-6 bg-white dark:bg-boxdark p-4 rounded-xl border border-stroke dark:border-dark-3 shadow-sm w-fit">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-stroke bg-transparent px-3 py-1.5 text-sm font-medium outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 cursor-pointer transition-colors" 
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-stroke bg-transparent px-3 py-1.5 text-sm font-medium outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 cursor-pointer transition-colors" 
            />
          </div>
          <button 
            onClick={fetchStats}
            className="rounded-md bg-primary px-5 py-[7px] text-sm font-semibold text-white shadow-md hover:bg-opacity-90 transition-all active:scale-95"
          >
            Analyze
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-boxdark">
          <div className="flex flex-col items-center">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
             <p className="mt-3 text-sm font-semibold text-gray-500">Loading Dashboard Data...</p>
          </div>
        </div>
      ) : stats ? (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          {renderStatusCards()}
          {renderTargetTracking()}
          {renderChannelCards()}
          {renderRankingBoard()}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-boxdark">
          <p className="font-semibold text-gray-500">No statistics available</p>
        </div>
      )}
    </div>
  );
}
