import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CreateOrders from "@/components/CreateOrder/CreateOrder";

export default function CsrCreateOrderPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="CSR Order Booking" />
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Use this form to create new customer sales orders with zone/area selection, payment plan choices, custom product entry, and website source tagging.
        </p>
        <CreateOrders />
      </div>
    </div>
  );
}
