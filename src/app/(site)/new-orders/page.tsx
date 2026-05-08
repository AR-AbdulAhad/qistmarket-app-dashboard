import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function NewOrdersPage() {
  return (
    <div>
      <Breadcrumb pageName="New Orders" />
        <OrderList forcedStatus="new" />
    </div>
  );
};