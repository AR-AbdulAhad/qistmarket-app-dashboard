"use client";

import { useEffect, useState } from "react";
import { employeeFetch } from "@/lib/employee-api";

interface AttendanceRecord {
  date: string;
  status: string;
  check_in?: string;
  check_out?: string;
  overtime_hrs?: number;
  missed_punch?: boolean;
  notes?: string;
}

const STATUS_ICON: Record<string, string> = {
  present: "✓",
  absent: "✗",
  late: "⚠",
  off: "—",
  holiday: "🎉",
};

const METHOD_COLORS: Record<string, string> = {
  manual: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  machine: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  bulk: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  fingerprint: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function getMethodFromNotes(notes?: string): string {
  if (!notes) return "";
  const m = notes.match(/\[method:(\w+)\]/);
  return m ? m[1] : "";
}

function getCleanNotes(notes?: string): string {
  if (!notes) return "";
  return notes.replace(/\[method:\w+\]\s*/g, "");
}

function parseDate(d: string | Date): Date {
  const s = typeof d === "string" ? d : d.toISOString();
  return new Date(s.slice(0, 10) + "T00:00:00Z");
}

export default function EmployeeAttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [selectedDay, setSelectedDay] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    employeeFetch(`/employee/attendance?month=${month}&year=${year}`).then((r) => {
      setRecords(r.records);
      setSummary(r.summary);
    });
  }, [month, year]);

  const getDay = (d: string | Date) => parseDate(d).getUTCDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const recordMap = new Map(records.map((r) => [getDay(r.date), r]));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Attendance</h1>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(+e.target.value)} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("default", { month: "long" })}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(+e.target.value)} className="rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-2">
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-yellow-dark/30 bg-yellow-light-4/20 px-4 py-3 text-sm text-dark-5 dark:text-gray-6">
        <strong>Policy:</strong> 3 Late = 1 Off deduction. Saturday/Sunday off penalties apply as per company policy.
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          ["Present", summary.present],
          ["Late", summary.late],
          ["Absent", summary.absent],
          ["Off", summary.off],
          ["Overtime (hrs)", summary.overtime_hours],
          ["Missed Punches", summary.missed_punches],
          ["Holidays", summary.holiday],
        ].map(([label, val]) => (
          <div key={label as string} className="rounded-lg border border-stroke bg-white p-3 text-center dark:border-stroke-dark dark:bg-dark-2">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-dark dark:text-white">{val ?? 0}</p>
          </div>
        ))}
      </div>

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
              onClick={() => rec && setSelectedDay(rec)}
              className={`cursor-pointer rounded-lg border p-2 text-center text-sm transition ${
                status === "present" ? "border-green/30 bg-green/10" :
                status === "late" ? "border-yellow-dark/30 bg-yellow-light-4/20" :
                status === "holiday" ? "border-blue-DEFAULT/30 bg-blue-light-5/20" :
                "border-stroke bg-white dark:border-stroke-dark dark:bg-dark-2"
              }`}
            >
              <p className="font-medium">{day}</p>
              <p className="text-lg">{STATUS_ICON[status] || "—"}</p>
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-stroke-dark dark:bg-dark-2" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Day Details</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Date:</span> {parseDate(selectedDay.date).toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
              <p><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{selectedDay.status}</span></p>
              {selectedDay.check_in && <p><span className="text-gray-500">Check In:</span> {selectedDay.check_in}</p>}
              {selectedDay.check_out && <p><span className="text-gray-500">Check Out:</span> {selectedDay.check_out}</p>}
              {selectedDay.overtime_hrs ? <p><span className="text-gray-500">Overtime:</span> {selectedDay.overtime_hrs}h</p> : null}
              {selectedDay.missed_punch && <p><span className="text-red">Missed Punch</span></p>}
              {(() => {
                const method = getMethodFromNotes(selectedDay.notes);
                const clean = getCleanNotes(selectedDay.notes);
                return method ? (
                  <p><span className="text-gray-500">Source:</span> <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${METHOD_COLORS[method] || "bg-gray-100 text-gray-700"}`}>{method}</span></p>
                ) : clean ? <p><span className="text-gray-500">Notes:</span> {clean}</p> : null;
              })()}
            </div>
            <button onClick={() => setSelectedDay(null)} className="mt-4 w-full rounded-lg border border-stroke px-4 py-2 text-sm dark:border-stroke-dark">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
