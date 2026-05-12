"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function WebsiteNewOrdersPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <Breadcrumb pageName="Website New Orders" />
      
      <div className="mb-8 p-1">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight italic">NEW PICKS</h2>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
          Website orders that were just picked up
        </p>
      </div>

      <OrderList 
        forcedStatus="new" 
        forcedChannel="Website"
      />
    </div>
  );
}
