"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import {
  Package, Clock, CheckCircle, XCircle, Truck, CreditCard, AlertTriangle, ShoppingBag, RefreshCw, ArrowRight,
  Wallet, Activity, ChevronRight, BoxIcon, ShieldCheck, FileText,
  Receipt, UserSquare2, Logs
} from "lucide-react";
import { useAuth } from "../../../../../contexts/AuthContext";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const getAuthHeaders = () => {
  const token = Cookies.get("auth_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

type Stats = {
  orders: {
    todayOrders: number;
    pendingVerification: number;
    approvedOrders: number;
    cancelledOrders: number;
    deliveryPending: number;
    delivered: number;
    expiredOrders: number;
  };
  performance: {
    dailySales: number;
    weeklySales: number;
    monthlySales: number;
  };
  installments: {
    totalInstallmentDue: number;
    totalInstallmentPaid: number;
    totalRemaining: number;
    totalArrears: number;
    pendingInstallmentCount: number;
    ordersWithPendingInstallments: number;
  };
  financials: {
    down_payments: number;
    installments_received: number;
    cash_from_recovery: number;
    cash_from_delivery: number;
    expenses: number;
    closing_cash: number;
  };
};

const PKR = (val: number) =>
  `PKR ${(val || 0).toLocaleString("en-PK")}`;

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  onClick,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`group relative overflow-hidden rounded-2xl border border-stroke bg-white p-6 shadow-default transition-all duration-300 hover:-translate-y-1 hover:shadow-card dark:border-dark-3 dark:bg-boxdark ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className={`absolute -right-6 -top-6 size-28 rounded-full ${accent} opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-2 text-3xl font-black text-black dark:text-white">{value}</p>
        {sub && <p className="mt-1 text-xs font-medium text-gray-400">{sub}</p>}
      </div>
      <div className={`flex size-12 items-center justify-center rounded-xl ${accent} shadow-md`}>
        <Icon className="size-5 text-white" />
      </div>
    </div>
    {onClick && (
      <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
        <span>View Details</span>
        <ArrowRight className="size-3" />
      </div>
    )}
  </div>
);

const QuickLink = ({ icon: Icon, label, href, color }: { icon: any; label: string; href: string; color: string }) => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-stroke bg-white p-4 shadow-default transition-all hover:-translate-y-1 hover:shadow-card hover:border-primary/30 dark:border-dark-3 dark:bg-boxdark"
    >
      <div className={`flex size-12 items-center justify-center rounded-xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon className="size-5 text-white" />
      </div>
      <span className="text-[11px] font-bold text-center text-gray-600 dark:text-gray-300 leading-tight">{label}</span>
    </button>
  );
};

export default function OutletDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [outletName, setOutletName] = useState("Outlet");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      const userRole = user.role?.toLowerCase();
      if (userRole === "sales officer") {
        router.push("/csr/dashboard");
      }
      setOutletName(user.outlet_name || user.full_name || "Outlet Portal");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/outlet/dashboard-stats`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Donut chart: Order status breakdown
  const orderDonutOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: ["Today's Orders", "Pending Verification", "Approved", "Delivery Pending", "Cancelled", "Delivered", "Expired"],
    colors: ["#3C50E0", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444", "#3C50E0", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444"],
    plotOptions: { pie: { donut: { size: "68%" } } },
    dataLabels: { enabled: false },
    legend: { position: "bottom", fontFamily: "inherit", fontSize: "12px" },
    tooltip: { theme: "dark" },
  };
  const orderDonutSeries = stats
    ? [
        stats.orders.todayOrders,
        stats.orders.pendingVerification,
        stats.orders.approvedOrders,
        stats.orders.deliveryPending,
        stats.orders.cancelledOrders,
        stats.orders.delivered,
        stats.orders.expiredOrders,
      ]
    : [0, 0, 0, 0, 0];

  // Bar chart: Sales comparison
  const salesBarOptions: ApexOptions = {
    chart: { type: "bar", fontFamily: "inherit", toolbar: { show: false } },
    colors: ["#3C50E0"],
    plotOptions: { bar: { borderRadius: 8, columnWidth: "45%" } },
    dataLabels: { enabled: false },
    xaxis: { categories: ["Daily", "Weekly", "Monthly"], axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (val) => `PKR ${(val / 1000).toFixed(0)}K` } },
    grid: { strokeDashArray: 5 },
    tooltip: { y: { formatter: (val) => PKR(val) } },
  };
  const salesBarSeries = [
    {
      name: "Sales",
      data: [
        stats?.performance.dailySales ?? 0,
        stats?.performance.weeklySales ?? 0,
        stats?.performance.monthlySales ?? 0,
      ],
    },
  ];

  // Radial gauge: Installment collection rate
  const collectionRate =
    stats && stats.installments.totalInstallmentDue > 0
      ? Math.round((stats.installments.totalInstallmentPaid / stats.installments.totalInstallmentDue) * 100)
      : 0;

  const radialOptions: ApexOptions = {
    chart: { type: "radialBar", fontFamily: "inherit" },
    plotOptions: {
      radialBar: {
        hollow: { size: "60%" },
        dataLabels: {
          name: { show: true, fontSize: "13px", color: "#6B7280", offsetY: -8 },
          value: { show: true, fontSize: "26px", fontWeight: "700", color: "#111827", formatter: (val) => `${val}%` },
        },
        track: { background: "#F3F4F6" },
      },
    },
    colors: ["#10B981"],
    labels: ["Collected"],
  };

  const quickLinks = [
    { icon: Package, label: "Orders", href: "/orders-list", color: "bg-blue-500" },
    { icon: CheckCircle, label: "Approved Order list", href: "/approved-order-list", color: "bg-blue-500" },
    { icon: BoxIcon, label: "Inventory", href: "/outlet/inventory", color: "bg-violet-500" },
    { icon: CreditCard, label: "Installments", href: "/outlet/installments", color: "bg-emerald-500" },
    { icon: Activity, label: "Recovery", href: "/outlet/recovery", color: "bg-orange-500" },
    { icon: Truck, label: "Delivery", href: "/outlet/delivery", color: "bg-cyan-500" },
    { icon: ShieldCheck, label: "Verification", href: "/outlet/verification", color: "bg-indigo-500" },
    { icon: Wallet, label: "Cash Register", href: "/outlet/cash-register", color: "bg-green-500" },
    { icon: FileText, label: "Reports", href: "/outlet/reports", color: "bg-slate-600" },
    { icon: Receipt, label: "Expenses", href: "/outlet/expenses", color: "bg-yellow-500" },
    { icon: UserSquare2, label: "Vendors", href: "/outlet/vendors", color: "bg-teal-500" },
    { icon: Logs, label: "Security Logs", href: "/outlet/security-logs", color: "bg-gray-500" },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse space-y-6 p-4">
        <div className="h-20 rounded-2xl bg-gray-200 dark:bg-dark-3" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-dark-3" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-72 rounded-2xl bg-gray-200 dark:bg-dark-3" />
          <div className="h-72 rounded-2xl bg-gray-200 dark:bg-dark-3" />
          <div className="h-72 rounded-2xl bg-gray-200 dark:bg-dark-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white">{outletName}</h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Live outlet performance — {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-stroke bg-white px-5 py-2.5 text-sm font-bold shadow-default transition-all hover:shadow-card hover:border-primary/30 dark:border-dark-3 dark:bg-boxdark disabled:opacity-60"
        >
          <RefreshCw className={`size-4 text-primary ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Quick Links */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-400">Quick Access</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-12">
          {quickLinks.map((ql) => (
            <QuickLink key={ql.label} {...ql} />
          ))}
        </div>
      </section>

      {/* Order Status KPI Row */}
      <section>
        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-400">Order Pipeline</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            icon={ShoppingBag}
            label="Today's Orders"
            value={stats?.orders.todayOrders ?? 0}
            accent="bg-blue-500"
            onClick={() => router.push("/orders-list")}
          />
          <StatCard
            icon={Clock}
            label="Pending Verification"
            value={stats?.orders.pendingVerification ?? 0}
            accent="bg-amber-500"
            onClick={() => router.push("/in-progress-orders")}
          />
          <StatCard
            icon={CheckCircle}
            label="Approved Orders"
            value={stats?.orders.approvedOrders ?? 0}
            accent="bg-emerald-500"
            onClick={() => router.push("/approved-order-list")}
          />
          <StatCard
            icon={Truck}
            label="Delivery Pending"
            value={stats?.orders.deliveryPending ?? 0}
            accent="bg-violet-500"
          />
            <StatCard
              icon={CheckCircle}
              label="Delivered Orders"
              value={stats?.orders.delivered ?? 0}
              accent="bg-green-500"
              onClick={() => router.push("/delivered-orders")}
            />
          <StatCard
            icon={XCircle}
            label="Cancelled Orders"
            value={stats?.orders.cancelledOrders ?? 0}
            accent="bg-red-500"
            onClick={() => router.push("/cancelled-orders")}
          />
          <StatCard
            icon={Clock}
            label="Expired Orders"
            value={stats?.orders.expiredOrders ?? 0}
            accent="bg-amber-800"
            onClick={() => router.push("/expired-orders")}
          />
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* Sales Bar Chart */}
        <div className="col-span-12 rounded-2xl border border-stroke bg-white px-6 pb-4 pt-6 shadow-default dark:border-dark-3 dark:bg-boxdark lg:col-span-5">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h3 className="text-xl font-black text-black dark:text-white">Sales Performance</h3>
              <p className="mt-0.5 text-sm text-gray-400">Daily / Weekly / Monthly</p>
            </div>
            <div className="rounded-xl bg-primary/10 px-4 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-primary">Monthly Total</p>
              <p className="text-base font-black text-primary">{PKR(stats?.performance.monthlySales ?? 0)}</p>
            </div>
          </div>
          <Chart options={salesBarOptions} series={salesBarSeries} type="bar" height={250} width="100%" />
        </div>

        {/* Order Donut Chart */}
        <div className="col-span-12 rounded-2xl border border-stroke bg-white px-6 pb-4 pt-6 shadow-default dark:border-dark-3 dark:bg-boxdark lg:col-span-4">
          <h3 className="mb-1 text-xl font-black text-black dark:text-white">Order Breakdown</h3>
          <p className="mb-2 text-sm text-gray-400">Status distribution</p>
          {orderDonutSeries.reduce((a, b) => a + b, 0) > 0 ? (
            <Chart options={orderDonutOptions} series={orderDonutSeries} type="donut" height={260} />
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-300 font-bold">No order data</div>
          )}
        </div>

        {/* Installment Radial */}
        <div className="col-span-12 rounded-2xl border border-stroke bg-white px-6 pb-4 pt-6 shadow-default dark:border-dark-3 dark:bg-boxdark lg:col-span-3">
          <h3 className="mb-1 text-xl font-black text-black dark:text-white">Collection Rate</h3>
          <p className="mb-2 text-sm text-gray-400">Installment recovery</p>
          <Chart options={radialOptions} series={[collectionRate]} type="radialBar" height={200} />
          <div className="mt-2 space-y-2 border-t border-stroke pt-4 dark:border-dark-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-400">Total Due</span>
              <span className="text-black dark:text-white">{PKR(stats?.installments.totalInstallmentDue ?? 0)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-400">Total Paid</span>
              <span className="text-emerald-500">{PKR(stats?.installments.totalInstallmentPaid ?? 0)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-400">Remaining</span>
              <span className="text-red-500">{PKR(stats?.installments.totalRemaining ?? 0)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Installment + Financial Row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Installment Detail Cards */}
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-boxdark">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-black text-black dark:text-white">Installment Summary</h3>
            <button
              onClick={() => router.push("/outlet/installments")}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
            >
              Manage <ChevronRight className="size-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Pending Installments", value: stats?.installments.pendingInstallmentCount ?? 0, accent: "bg-amber-500", format: "number" },
              { label: "Orders Affected", value: stats?.installments.ordersWithPendingInstallments ?? 0, accent: "bg-orange-500", format: "number" },
              { label: "Total Arrears", value: stats?.installments.totalArrears ?? 0, accent: "bg-red-500", format: "currency" },
              { label: "Total Remaining", value: stats?.installments.totalRemaining ?? 0, accent: "bg-violet-500", format: "currency" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-gray-50 p-4 dark:bg-dark-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                <p className={`mt-1.5 text-xl font-black ${item.accent === "bg-red-500" ? "text-red-500" : item.accent === "bg-amber-500" ? "text-amber-500" : "text-black dark:text-white"}`}>
                  {item.format === "currency" ? PKR(item.value as number) : item.value}
                </p>
              </div>
            ))}
          </div>
          {(stats?.installments.totalArrears ?? 0) > 0 && (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
              <AlertTriangle className="size-4 shrink-0 text-red-500" />
              <p className="text-xs font-bold text-red-600 dark:text-red-400">
                PKR {(stats?.installments.totalArrears ?? 0).toLocaleString()} in arrears requires immediate follow-up
              </p>
            </div>
          )}
        </div>

        {/* Financial Overview */}
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-dark-3 dark:bg-boxdark">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-black text-black dark:text-white">Cash Register</h3>
            <button
              onClick={() => router.push("/outlet/cash-register")}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
            >
              View <ChevronRight className="size-3" />
            </button>
          </div>
          <div className="space-y-2">
            {[
              { label: "Down Payments Collected", value: stats?.financials.down_payments ?? 0, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { label: "Installments Received", value: stats?.financials.installments_received ?? 0, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Cash from Recovery", value: stats?.financials.cash_from_recovery ?? 0, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
              { label: "Cash from Delivery", value: stats?.financials.cash_from_delivery ?? 0, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
              { label: "Total Expenses", value: stats?.financials.expenses ?? 0, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
            ].map((row) => (
              <div key={row.label} className={`flex items-center justify-between rounded-xl px-4 py-3 ${row.bg}`}>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{row.label}</span>
                <span className={`text-sm font-black ${row.color}`}>{PKR(row.value)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-4">
              <span className="text-sm font-black uppercase tracking-wide text-primary">Closing Balance</span>
              <span className="text-xl font-black text-primary">{PKR(stats?.financials.closing_cash ?? 0)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
