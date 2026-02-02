import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CreateOrders from "@/components/CreateOrder/CreateOrder";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="Create Order" />

    <CreateOrders />
    </div>
  );
};

