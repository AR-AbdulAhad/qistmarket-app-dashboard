"use client";

import { useEffect, useState } from "react";
import { employeeFetch } from "@/lib/employee-api";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Performance {
  kpi_score: number;
  attendance_score: number;
  recovery_pct?: number;
  team_rank?: number;
  targets?: Record<string, number>;
  achieved?: Record<string, number>;
  month: number;
  year: number;
}

export default function EmployeePerformancePage() {
  const [current, setCurrent] = useState<Performance | null>(null);
  const [history, setHistory] = useState<Performance[]>([]);

  useEffect(() => {
    employeeFetch("/employee/performance").then((r) => {
      setCurrent(r.current);
      setHistory(r.history || []);
    });
  }, []);

  const barOptions = {
    chart: { type: "bar" as const, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    colors: ["#ff3d3d", "#22AD5C"],
    xaxis: { categories: Object.keys(current?.targets || { Sales: 100, Recovery: 90 }) },
    legend: { position: "top" as const },
  };

  const barSeries = [
    { name: "Target", data: Object.values(current?.targets || { Sales: 100, Recovery: 90 }) },
    { name: "Achieved", data: Object.values(current?.achieved || { Sales: 75, Recovery: 72 }) },
  ];

  const lineOptions = {
    chart: { type: "line" as const, toolbar: { show: false } },
    stroke: { curve: "smooth" as const },
    colors: ["#ff3d3d"],
    xaxis: { categories: history.map((h) => `${h.month}/${h.year}`).reverse() },
  };

  const lineSeries = [{ name: "KPI Score", data: [...history].reverse().map((h) => h.kpi_score) }];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Performance</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stroke bg-white p-5 dark:border-stroke-dark dark:bg-dark-2">
          <p className="text-sm text-gray-500">KPI Score</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-primary">{current?.kpi_score ?? 0}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-3">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${current?.kpi_score ?? 0}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 dark:border-stroke-dark dark:bg-dark-2">
          <p className="text-sm text-gray-500">Attendance Score</p>
          <p className="mt-2 text-3xl font-bold text-green">{current?.attendance_score ?? 0}%</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 dark:border-stroke-dark dark:bg-dark-2">
          <p className="text-sm text-gray-500">Recovery %</p>
          <p className="mt-2 text-3xl font-bold text-dark dark:text-white">{current?.recovery_pct ?? 0}%</p>
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 dark:border-stroke-dark dark:bg-dark-2">
          <p className="text-sm text-gray-500">Team Rank</p>
          <p className="mt-2 text-3xl font-bold text-dark dark:text-white">#{current?.team_rank ?? "—"}</p>
          <p className="text-xs text-gray-500">Your rank only</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-stroke bg-white p-5 dark:border-stroke-dark dark:bg-dark-2">
          <h2 className="mb-4 font-semibold">Targets vs Achieved</h2>
          {typeof window !== "undefined" && (
            <Chart options={barOptions} series={barSeries} type="bar" height={280} />
          )}
        </div>
        <div className="rounded-xl border border-stroke bg-white p-5 dark:border-stroke-dark dark:bg-dark-2">
          <h2 className="mb-4 font-semibold">Monthly History</h2>
          {history.length > 0 && typeof window !== "undefined" && (
            <Chart options={lineOptions} series={lineSeries} type="line" height={280} />
          )}
          {history.length === 0 && <p className="text-sm text-gray-500">No history yet</p>}
        </div>
      </div>
    </div>
  );
}
