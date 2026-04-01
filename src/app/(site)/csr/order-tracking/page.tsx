import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function CsrOrderTrackingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <Breadcrumb pageName="CSR Order Tracking" />
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Order Tracking</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Monitor the full order lifecycle with search, filters, and status tracking for pending, verification, delivery, completed, cancelled, and expired orders.
        </p>
      </div>
      <OrderList forcedStatus="new,pending,completed,cancelled,delivered,expired" hideActions={false} />
    </div>
  );
}
