"use client";

import { useEffect, useState } from "react";
import { employeeFetch } from "@/lib/employee-api";
import { Download } from "lucide-react";
import Image from "next/image";

interface EmployeeProfile {
  employee_id: string;
  full_name: string;
  cnic?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  qualification?: string;
  experience?: string;
  date_of_birth?: string;
  date_of_joining?: string;
  department?: string;
  designation?: string;
  outlet?: { name: string };
  qr_code?: string;
  documents?: { id: number; title: string; doc_type: string }[];
}

export default function EmployeeProfilePage() {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    employeeFetch("/employee/profile").then((r) => setEmployee(r.employee));
  }, []);

  if (!employee) return <p className="text-gray-500">Loading profile...</p>;

  const fields = [
    ["Employee ID", employee.employee_id],
    ["CNIC", employee.cnic],
    ["Phone", employee.phone],
    ["Email", employee.email],
    ["Address", employee.address],
    ["Emergency Contact", employee.emergency_contact],
    ["Emergency Phone", employee.emergency_phone],
    ["Qualification", employee.qualification],
    ["Experience", employee.experience],
    ["Date of Birth", employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : "—"],
    ["Date of Joining", employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : "—"],
    ["Department", employee.department],
    ["Designation", employee.designation],
    ["Outlet", employee.outlet?.name],
  ];

  const downloadQr = () => {
    if (!employee.qr_code) return;
    const a = document.createElement("a");
    a.href = employee.qr_code;
    a.download = `${employee.employee_id}-qr.png`;
    a.click();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Personal Profile</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-stroke bg-white p-6 dark:border-stroke-dark dark:bg-dark-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
                <p className="mt-1 text-sm font-medium text-dark dark:text-white">{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stroke bg-white p-6 text-center dark:border-stroke-dark dark:bg-dark-2">
          <p className="mb-4 text-sm font-semibold text-dark dark:text-white">Employee QR Code</p>
          {employee.qr_code ? (
            <>
              <Image src={employee.qr_code} alt="QR" width={200} height={200} className="mx-auto" unoptimized />
              <button onClick={downloadQr} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm text-white">
                <Download className="h-4 w-4" /> Download QR
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500">No QR code</p>
          )}
        </div>
      </div>

      {employee.documents && employee.documents.length > 0 && (
        <div className="mt-6 rounded-xl border border-stroke bg-white p-6 dark:border-stroke-dark dark:bg-dark-2">
          <h2 className="mb-4 font-semibold text-dark dark:text-white">Documents</h2>
          <ul className="space-y-2">
            {employee.documents.map((doc) => (
              <li key={doc.id} className="flex justify-between rounded-lg bg-gray-2 px-4 py-2 text-sm dark:bg-dark-3">
                <span>{doc.title}</span>
                <span className="text-gray-500">{doc.doc_type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
