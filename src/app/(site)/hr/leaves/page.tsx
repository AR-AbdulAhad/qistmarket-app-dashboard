"use client";

import { useEffect, useState } from "react";
import { hrFetch } from "@/lib/employee-api";
import toast from "react-hot-toast";

interface LeaveRequest {
  id: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
  employee: { full_name: string; employee_id: string; department?: string };
}

export default function HrLeavesPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  const load = () => hrFetch("/leaves/pending").then((r) => setRequests(r.requests));

  useEffect(() => { load(); }, []);

  const handleAction = async (id: number, status: string, rejection_reason?: string) => {
    try {
      await hrFetch(`/leaves/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejection_reason }),
      });
      toast.success(`Leave ${status}`);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Pending Leave Requests</h1>

      <div className="space-y-4">
        {requests.length === 0 && <p className="text-gray-500">No pending leave requests</p>}
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-stroke bg-white p-5 dark:border-stroke-dark dark:bg-dark-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-dark dark:text-white">{r.employee.full_name}</p>
                <p className="text-xs text-gray-500">{r.employee.employee_id} · {r.employee.department}</p>
                <p className="mt-2 text-sm capitalize">{r.leave_type} leave · {r.days} day(s)</p>
                <p className="text-xs text-gray-500">
                  {new Date(r.from_date).toLocaleDateString()} – {new Date(r.to_date).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm">{r.reason}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(r.id, "approved")} className="rounded-lg bg-green px-4 py-2 text-sm text-white">Approve</button>
                <button onClick={() => handleAction(r.id, "rejected", "Not approved at this time")} className="rounded-lg bg-red px-4 py-2 text-sm text-white">Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
