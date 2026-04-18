"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import WebsiteOrdersTable from "@/components/WebsiteOrders/WebsiteOrdersTable";

export default function CsrWebsiteOrdersPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <Breadcrumb pageName="Website Orders" />
      
      <div className="mb-8 p-1">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Website Feed</h2>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
          Connect & Pick orders directly from the QistMarket website
        </p>
      </div>

      <WebsiteOrdersTable />
    </div>
  );
}
