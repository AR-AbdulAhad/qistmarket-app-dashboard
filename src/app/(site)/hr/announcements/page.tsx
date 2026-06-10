"use client";

import { useState } from "react";
import { hrFetch } from "@/lib/employee-api";
import toast from "react-hot-toast";

export default function HrAnnouncementsPage() {
  const [form, setForm] = useState({ title: "", message: "", type: "announcement" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await hrFetch("/announcements", { method: "POST", body: JSON.stringify(form) });
      toast.success(`Sent to ${data.count} employees`);
      setForm({ title: "", message: "", type: "announcement" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-dark dark:text-white">Send Announcement</h1>
      <p className="mb-6 text-sm text-gray-500">Broadcast to all active employees with portal access</p>

      <form onSubmit={handleSubmit} className="max-w-xl rounded-xl border border-stroke bg-white p-6 dark:border-stroke-dark dark:bg-dark-2">
        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-500">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-3">
            <option value="announcement">Announcement</option>
            <option value="salary">Salary</option>
            <option value="warning">Warning</option>
            <option value="promotion">Promotion</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-500">Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-3" />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-500">Message</label>
          <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-3" />
        </div>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Sending..." : "Send to All Employees"}
        </button>
      </form>
    </div>
  );
}
