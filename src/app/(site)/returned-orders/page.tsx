import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function ReturnedOrdersPage() {
  return (
    <div>
      <Breadcrumb pageName="Returned Orders" />
      <OrderList forcedStatus="returned" apiEndpoint="/api/orders/returned-list" />
    </div>
  );
};