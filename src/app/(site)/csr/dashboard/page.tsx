"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "../../../../../contexts/AuthContext";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface CsrDashboardStats {
  totalOrdersRange: number;
  websiteOrdersPending: number;
  repeatCustomersRange: number;
  clearAccountsCount: number;
  statusCounts: {
    new: number;
    pending: number;
    in_progress: number;
    expired: number;
    picked: number;
    delivered: number;
    cancelled: number;
    approved: number;
  };
  rangeSales: number;
  remainingTarget: number;
  salesTrend: { x: string; y: number }[];
}

export default function CsrDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CsrDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      const userRole = user.role?.toLowerCase();
      if (userRole === "outlet") {
        router.push("/outlet/dashboard");
      }
    }
  }, [user, authLoading, router]);
  
  // Default to 1st of month to today for a decent view
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      const query = new URLSearchParams();
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/csr-dashboard-stats?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
  }, []);

  const cards = stats
    ? [
        { label: "Orders in Range", value: stats.totalOrdersRange, color: "bg-blue-500", icon: "📦" },
        { label: "Website Pending", value: stats.websiteOrdersPending, color: "bg-cyan-500", icon: "🌐" },
        { label: "Repeat Customers", value: stats.repeatCustomersRange, color: "bg-indigo-500", icon: "👥" },
        { label: "Target Remaining", value: `Rs ${stats.remainingTarget.toLocaleString()}`, color: "bg-green-500", icon: "💎" },
      ]
    : [];

  // Chart configuration for Sales Trend
  const salesOptions: ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "inherit",
      toolbar: { show: false },
    },
    colors: ["#3C50E0"],
    stroke: { curve: "smooth", width: 2 },
    dataLabels: { enabled: false },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      type: "datetime",
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => `Rs ${val.toLocaleString()}`,
      },
    },
    grid: {
      strokeDashArray: 5,
      borderColor: "#e0e0e0", // Will adapt implicitly if we define dark mode overrides, 
      // but for simple cases apexcharts handles it well if we don't force too many colors.
    },
    tooltip: {
      x: { format: "dd MMM yyyy" },
    },
  };

  // Chart configuration for Status Distribution
  const statusLabels = stats ? Object.keys(stats.statusCounts).map(s => s.replace('_', ' ').toUpperCase()) : [];
  const statusSeries = stats ? Object.values(stats.statusCounts) : [];
  
  const statusOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: statusLabels,
    colors: ["#3b82f6", "#eab308", "#f97316", "#ef4444", "#8b5cf6", "#22c55e", "#ef4444", "#06b6d4"],
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
        },
      },
    },
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      fontFamily: "inherit",
    },
  };

  return (
    <div className="mx-auto w-full max-w-7xl pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <Breadcrumb pageName="CSR Analytics Dashboard" />
        
        {/* Date Filter */}
        <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-default dark:bg-boxdark mt-4 sm:mt-0 border border-stroke dark:border-dark-3">
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
          <div className="flex flex-col self-end pb-[2px]">
            <button 
              onClick={fetchStats}
              className="rounded-md bg-primary px-5 py-[7px] text-sm font-semibold text-white shadow-md hover:bg-opacity-90 hover:shadow-lg transition-all active:scale-95"
            >
              Analyze
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
            <div className="h-96 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
          </div>
        </div>
      ) : stats ? (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => (
              <div key={card.label} className="group rounded-xl border border-stroke bg-white p-6 shadow-default transition-all hover:-translate-y-1 hover:shadow-card dark:border-dark-3 dark:bg-boxdark relative overflow-hidden">
                <div className={`absolute -right-4 -top-4 size-24 rounded-full ${card.color} opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150`}></div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</h4>
                    <h2 className="text-2xl font-bold text-black dark:text-white mt-1.5">
                       {card.value}
                    </h2>
                  </div>
                  <div className={`flex items-center justify-center size-12 rounded-full ${card.color} text-white shadow-md text-xl bg-gradient-to-br from-white/20 to-transparent`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            
            {/* Main Sales Trend Chart */}
            <div className="col-span-12 rounded-xl border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-dark-3 dark:bg-boxdark lg:col-span-8">
              <div className="mb-4 justify-between items-center sm:flex">
                <div>
                  <h4 className="text-xl font-bold text-black dark:text-white">
                    Sales Trend Overview
                  </h4>
                  <p className="text-sm font-medium mt-1 text-gray-500">Daily sales performance</p>
                </div>
                <div className="mt-4 sm:mt-0">
                   <div className="rounded-lg bg-primary/10 px-4 py-2 border border-primary/20 dark:bg-primary/20 dark:border-primary/30 shadow-sm">
                     <p className="text-xs uppercase tracking-wider font-bold text-primary dark:text-gray-300 mb-0.5">Total Period Sales</p>
                     <p className="text-lg font-bold text-primary dark:text-white">PKR {stats.rangeSales.toLocaleString()}</p>
                   </div>
                </div>
              </div>
              <div className="mt-6">
                <Chart
                  options={salesOptions}
                  series={[{ name: "Sales", data: stats.salesTrend }]}
                  type="area"
                  height={320}
                  width="100%"
                />
              </div>
            </div>

            {/* Status Distribution Donut Chart */}
            <div className="col-span-12 rounded-xl border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-dark-3 dark:bg-boxdark lg:col-span-4 flex flex-col">
              <div className="mb-4 flex-none">
                <h4 className="text-xl font-bold text-black dark:text-white">
                  Order Processing
                </h4>
                <p className="text-sm font-medium mt-1 text-gray-500">Status ratio</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div id="statusDistributionChart" className="w-full relative -top-3">
                  {statusSeries.reduce((a, b) => a + b, 0) > 0 ? (
                    <Chart
                      options={statusOptions}
                      series={statusSeries}
                      type="donut"
                      height={320}
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center text-gray-400 font-medium">
                      No data to chart
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-boxdark">
          <p className="font-semibold text-gray-500">No statistics available</p>
        </div>
      )}
    </div>
  );
}
