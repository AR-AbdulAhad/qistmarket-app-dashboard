"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

interface ComplaintItem {
  id: number;
  complaint_id: string;
  customer_name: string;
  customer_cnic: string | null;
  mobile_number: string;
  description: string;
  status: string;
  resolution_note: string | null;
  created_at: string;
}

export default function CsrComplaintsPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerCnic, setCustomerCnic] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [description, setDescription] = useState("");
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setComplaints(json.data.complaints || []);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const submitComplaint = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customerName.trim() || !mobileNumber.trim() || !description.trim()) {
      toast.error("Please fill customer name, mobile number, and description.");
      return;
    }
    setSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_cnic: customerCnic.trim() || null,
          mobile_number: mobileNumber.trim(),
          description: description.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to submit complaint.");
      toast.success("Complaint submitted successfully.");
      setCustomerName("");
      setCustomerCnic("");
      setMobileNumber("");
      setDescription("");
      loadComplaints();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Unable to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Breadcrumb pageName="Complaints" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Record a Complaint</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create a complaint record for website or customer issues. CSR can resolve and add feedback once solved.
          </p>

          <form onSubmit={submitComplaint} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#ff3d3d] focus:ring-2 focus:ring-[#ff3d3d]/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={customerCnic}
                onChange={(e) => setCustomerCnic(e.target.value)}
                placeholder="Customer CNIC (optional)"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#ff3d3d] focus:ring-2 focus:ring-[#ff3d3d]/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="Mobile Number"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#ff3d3d] focus:ring-2 focus:ring-[#ff3d3d]/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Complaint description"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#ff3d3d] focus:ring-2 focus:ring-[#ff3d3d]/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-[#ff3d3d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Complaints</h2>
          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
              ))
            ) : complaints.length ? (
              complaints.map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.customer_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.complaint_id} · {item.mobile_number}</p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{item.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                No complaints recorded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
