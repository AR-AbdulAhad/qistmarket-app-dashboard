"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OfficerComplaints from "@/components/complaints/OfficerComplaints";

export default function VerificationComplaintsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Breadcrumb pageName="My Complaints" />
      <OfficerComplaints />
    </div>
  );
}
