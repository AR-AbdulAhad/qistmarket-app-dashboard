"use client";

import { useEffect, useState } from "react";
import { hrFetch } from "@/lib/employee-api";
import { Search, Fingerprint, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  department?: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  check_in?: string;
  check_out?: string;
  overtime_hrs?: number;
  missed_punch?: boolean;
  notes?: string;
}

const STATUS_ICON: Record<string, string> = { present: "✓", absent: "✗", late: "⚠", off: "—", holiday: "🎉" };

export default function HrAttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<any>(null);

  useEffect(() => {
    hrFetch("/employees").then((r) => setEmployees(r.employees));
    hrFetch("/biometric/device-status").then((r) => setDeviceStatus(r.device)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEmp) return;
    setLoading(true);
    hrFetch(`/employees/${selectedEmp}/attendance?month=${month}&year=${year}`)
      .then((r) => setRecords(r.records))
      .finally(() => setLoading(false));
  }, [selectedEmp, month, year]);

  const filtered = employees.filter((e) =>
    e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  const getDay = (d: string | Date) => {
    const s = typeof d === "string" ? d : d.toISOString();
    return new Date(s.slice(0, 10) + "T00:00:00Z").getUTCDate();
  };
  const daysInMonth = new Date(year, month, 0).getDate();
  const recordMap = new Map(records.map((r) => [getDay(r.date), r]));

  const updateAttendance = async (date: string, status: string, check_in?: string, check_out?: string) => {
    if (!selectedEmp) return;
    await hrFetch(`/employees/${selectedEmp}/attendance`, {
      method: "POST",
      body: JSON.stringify({ date, status, check_in, check_out, method: "manual" }),
    });
    toast.success("Attendance updated");
    const r = await hrFetch(`/employees/${selectedEmp}/attendance?month=${month}&year=${year}`);
    setRecords(r.records);
  };

  const bulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const raw = (data.get("entries") as string || "").trim();
    if (!raw) { toast.error("No entries"); return; }
    const recordsList: any[] = [];
    for (const line of raw.split("\n").filter(Boolean)) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        recordsList.push({ employee_id: parts[0], date: parts[1], status: parts[2] || "present" });
      }
    }
    if (!recordsList.length) { toast.error("No valid entries"); return; }
    await hrFetch("/attendance/bulk", { method: "POST", body: JSON.stringify({ records: recordsList }) });
    toast.success(`Bulk attendance recorded`);
    setShowBulk(false);
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmp);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Attendance Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(!showBulk)} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark">
            {showBulk ? "Cancel Bulk" : "Bulk Upload"}
          </button>
          <button onClick={() => setShowBiometric(!showBiometric)} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark">
            <Fingerprint className="mr-1 inline h-4 w-4" /> Biometric
          </button>
        </div>
      </div>

      {showBiometric && deviceStatus && (
        <div className="mb-6 rounded-xl border border-stroke bg-white p-4 dark:border-stroke-dark dark:bg-dark-2">
          <h3 className="mb-2 font-semibold">Biometric Device</h3>
          <p className="text-sm">Device: {deviceStatus.model} ({deviceStatus.ip}:{deviceStatus.port})</p>
          <p className="text-sm">Status: {deviceStatus.connected ? <span className="text-green">Connected</span> : <span className="text-red">Disconnected</span>}</p>
          <button onClick={async () => {
            await hrFetch("/biometric/sync", { method: "POST" });
            toast.success("Biometric sync initiated");
          }} className="mt-3 flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs text-white">
            <RefreshCw className="h-3 w-3" /> Sync Now
          </button>
        </div>
      )}

      {showBulk && (
        <form onSubmit={bulkSubmit} className="mb-6 rounded-xl border border-stroke bg-white p-4 dark:border-stroke-dark dark:bg-dark-2">
          <h3 className="mb-2 font-semibold">Bulk Attendance Entry</h3>
          <div className="mb-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            <strong>Format:</strong> employee_id, date (YYYY-MM-DD), status (optional, defaults to present)<br/>
            <strong>Sample:</strong><br/>
            EMP001, 2026-06-01, present<br/>
            EMP002, 2026-06-01, absent<br/>
            EMP003, 2026-06-01, late
          </div>
          <textarea name="entries" rows={5} placeholder="EMP001, 2026-06-01, present&#10;EMP002, 2026-06-01, absent" className="mb-2 w-full rounded-lg border border-stroke px-3 py-2 text-sm font-mono dark:border-stroke-dark dark:bg-dark-2" />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm text-white">Submit Bulk</button>
        </form>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee by name or ID..."
            className="w-full rounded-lg border border-stroke py-2 pl-9 pr-3 text-sm dark:border-stroke-dark dark:bg-dark-2"
          />
        </div>
        <select
          value={selectedEmp || ""}
          onChange={(e) => setSelectedEmp(e.target.value ? parseInt(e.target.value) : null)}
          className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2"
        >
          <option value="">Select employee</option>
          {filtered.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>
          ))}
        </select>
        <select value={month} onChange={(e) => setMonth(+e.target.value)} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("default", { month: "long" })}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(+e.target.value)} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2">
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {selectedEmployee && (
        <p className="mb-4 text-sm text-gray-500">Managing: <strong>{selectedEmployee.full_name}</strong> ({selectedEmployee.department || "No department"})</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading attendance...</p>
      ) : selectedEmp ? (
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500">{d}</div>
          ))}
          {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const rec = recordMap.get(day);
            const dow = new Date(year, month - 1, day).getDay();
            const isWeekend = dow === 0 || dow === 6;
            const status = rec?.status || (isWeekend ? "off" : "absent");
            return (
              <div
                key={day}
                className={`rounded-lg border p-2 text-center text-sm cursor-pointer hover:shadow ${
                  status === "present" ? "border-green/30 bg-green/10" :
                  status === "late" ? "border-yellow-dark/30 bg-yellow-light-4/20" :
                  status === "holiday" ? "border-blue-DEFAULT/30 bg-blue-light-5/20" :
                  "border-stroke bg-white dark:border-stroke-dark dark:bg-dark-2"
                }`}
                onClick={() => {
                  const newStatus = status === "present" ? "absent" : "present";
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  updateAttendance(dateStr, newStatus);
                }}
              >
                <p className="font-medium">{day}</p>
                <p className="text-lg">{STATUS_ICON[status] || "—"}</p>
                {rec?.check_in && <p className="text-[10px] text-gray-400">{rec.check_in}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">Select an employee to view attendance.</p>
      )}
    </div>
  );
}
