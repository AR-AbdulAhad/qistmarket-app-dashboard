"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { BarChart3, Store, UserRound, TrendingUp } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PageHeader from "@/components/Accounts/PageHeader";
import EmptyState from "@/components/Accounts/EmptyState";
import { ChartSkeleton } from "@/components/Accounts/Skeleton";
import { PKR } from "@/components/Accounts/StatCard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface RecoveryAnalyticsData {
  totalDue: number;
  totalRecovered: number;
  recoveryPercentage: number;
  outletWise: { outlet_id: number | null; outlet_name: string; due: number; recovered: number; recoveryPercentage: number }[];
  officerWise: { officer_id: number | null; officer_name: string; due: number; recovered: number; recoveryPercentage: number }[];
}

const RANGES = ["Day", "Week", "Month", "Quarter", "Year"] as const;

export default function RecoveryAnalyticsPage() {
  const [data, setData] = useState<RecoveryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<(typeof RANGES)[number]>("Month");

  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (!token) return;

    setLoading(true);
    fetch(`${BACKEND_URL}/api/accounts/recovery-analytics?range=${range}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch((err) => console.error("Failed to load recovery analytics:", err))
      .finally(() => setLoading(false));
  }, [range]);

  const gridColor = "#e1e0d9";
  const axisLabelStyle = { colors: "#898781", fontSize: "11px", fontWeight: 600 };

  // Only outlets/officers with actual due activity this period — avoids
  // rendering an axis-only chart full of invisible zero-width bars.
  const activeOutlets = (data?.outletWise || []).filter((o) => o.due > 0).sort((a, b) => b.due - a.due);
  const activeOfficers = (data?.officerWise || []).filter((o) => o.due > 0).sort((a, b) => b.due - a.due);

  const horizontalBarOptions = (categories: string[], color: string): ApexOptions => ({
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { borderRadius: 5, borderRadiusApplication: "end", barHeight: "55%", horizontal: true } },
    dataLabels: { enabled: true, formatter: (v) => `${v}%`, style: { fontSize: "11px", fontWeight: 700, colors: ["#52514e"] }, offsetX: 18 },
    colors: [color],
    grid: { strokeDashArray: 4, borderColor: gridColor, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    xaxis: { categories, min: 0, max: 100, labels: { formatter: (v) => `${v}%`, style: axisLabelStyle }, axisBorder: { show: false } },
    yaxis: { labels: { style: axisLabelStyle } },
    tooltip: { x: { formatter: (v) => `${v}%` } },
    states: { hover: { filter: { type: "darken" } } },
  });

  const chartHeight = (count: number) => Math.max(220, count * 46);

  return (
    <>
      <Breadcrumb pageName="Recovery Analytics" />
      <PageHeader
        icon={BarChart3}
        title="Recovery Analytics"
        subtitle="Recovery percentage across outlets and officers for the selected period."
        actions={
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-dark-3">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  range === r ? "bg-white text-[#ff3d3d] shadow-sm dark:bg-boxdark" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
            <TrendingUp className="size-4" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">Recovery %</p>
            <p className="text-2xl font-black leading-none text-emerald-700 dark:text-emerald-400">{data?.recoveryPercentage ?? 0}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-boxdark">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recovered / Due</p>
            <p className="text-lg font-bold text-dark dark:text-white">{PKR(data?.totalRecovered || 0)} <span className="font-normal text-gray-400">/</span> {PKR(data?.totalDue || 0)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-boxdark">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10"><Store className="size-4" /></div>
              <h2 className="text-sm font-bold text-dark dark:text-white">Outlet Wise Recovery %</h2>
            </div>
            {activeOutlets.length > 0 ? (
              <Chart
                options={horizontalBarOptions(activeOutlets.map((o) => o.outlet_name), "#2a78d6")}
                series={[{ name: "Recovery %", data: activeOutlets.map((o) => o.recoveryPercentage) }]}
                type="bar"
                height={chartHeight(activeOutlets.length)}
              />
            ) : (
              <EmptyState icon={Store} title="No installments due this period" description="Nothing was due for any outlet in the selected range, so there's no recovery rate to show yet." />
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-boxdark">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10"><UserRound className="size-4" /></div>
              <h2 className="text-sm font-bold text-dark dark:text-white">Officer Wise Recovery %</h2>
            </div>
            {activeOfficers.length > 0 ? (
              <Chart
                options={horizontalBarOptions(activeOfficers.map((o) => o.officer_name), "#eb6834")}
                series={[{ name: "Recovery %", data: activeOfficers.map((o) => o.recoveryPercentage) }]}
                type="bar"
                height={chartHeight(activeOfficers.length)}
              />
            ) : (
              <EmptyState icon={UserRound} title="No installments due this period" description="Nothing was due for any officer in the selected range, so there's no recovery rate to show yet." />
            )}
          </div>
        </div>
      )}
    </>
  );
}
