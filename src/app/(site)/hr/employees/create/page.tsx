"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hrFetch } from "@/lib/employee-api";
import toast from "react-hot-toast";
import Link from "next/link";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function CreateEmployeePage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<{ id: number; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string; employee_id: string } | null>(null);
  const [form, setForm] = useState({
    full_name: "", cnic: "", phone: "", email: "", address: "",
    emergency_contact: "", emergency_phone: "", qualification: "", experience: "",
    date_of_birth: "", date_of_joining: "", department: "", designation: "",
    outlet_id: "", basic_salary: "",
  });

  useEffect(() => {
    const token = Cookies.get("auth_token");
    fetch(`${API}/api/outlets/all-outlets`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setOutlets(d.outlets || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await hrFetch("/employees", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          outlet_id: form.outlet_id ? parseInt(form.outlet_id) : null,
          basic_salary: form.basic_salary ? parseFloat(form.basic_salary) : null,
        }),
      });
      setCredentials(data.credentials);
      toast.success("Employee created with portal credentials");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className="mb-1 block text-sm text-gray-500">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-3"
        required={key === "full_name"}
      />
    </div>
  );

  if (credentials) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-stroke bg-white p-8 dark:border-stroke-dark dark:bg-dark-2">
        <h1 className="mb-4 text-xl font-bold text-green">Employee Created!</h1>
        <div className="space-y-3 rounded-lg bg-gray-2 p-4 font-mono text-sm dark:bg-dark-3">
          <p><strong>Employee ID:</strong> {credentials.employee_id}</p>
          <p><strong>Username:</strong> {credentials.username}</p>
          <p><strong>Password:</strong> {credentials.password}</p>
        </div>
        <p className="mt-4 text-xs text-gray-500">Save these credentials. Portal is auto-activated.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => router.push("/hr/employees")} className="flex-1 rounded-lg bg-primary py-2 text-white">View All Employees</button>
          <button onClick={() => { setCredentials(null); setForm({ full_name: "", cnic: "", phone: "", email: "", address: "", emergency_contact: "", emergency_phone: "", qualification: "", experience: "", date_of_birth: "", date_of_joining: "", department: "", designation: "", outlet_id: "", basic_salary: "" }); }} className="flex-1 rounded-lg border border-stroke py-2 dark:border-stroke-dark">Add Another</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/hr/employees" className="text-sm text-primary hover:underline">← Back to Employees</Link>
        <h1 className="mt-2 text-2xl font-bold text-dark dark:text-white">Add New Employee</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-stroke bg-white p-6 dark:border-stroke-dark dark:bg-dark-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("full_name", "Full Name *")}
          {field("cnic", "CNIC")}
          {field("phone", "Phone")}
          {field("email", "Email", "email")}
          {field("department", "Department")}
          {field("designation", "Designation")}
          {field("date_of_birth", "Date of Birth", "date")}
          {field("date_of_joining", "Date of Joining", "date")}
          {field("basic_salary", "Basic Salary", "number")}
          <div>
            <label className="mb-1 block text-sm text-gray-500">Outlet</label>
            <select value={form.outlet_id} onChange={(e) => setForm({ ...form, outlet_id: e.target.value })}
              className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-stroke-dark dark:bg-dark-3">
              <option value="">— None —</option>
              {outlets.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">{field("address", "Address")}</div>
          {field("emergency_contact", "Emergency Contact Name")}
          {field("emergency_phone", "Emergency Phone")}
          <div className="sm:col-span-2">{field("qualification", "Qualification")}</div>
          <div className="sm:col-span-2">{field("experience", "Experience")}</div>
        </div>
        <button type="submit" disabled={loading} className="mt-6 rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Creating..." : "Create Employee & Activate Portal"}
        </button>
      </form>
    </div>
  );
}
