import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function AllOrdersPage() {
  return (
    <div>
      <Breadcrumb pageName="All Orders" />
        <OrderList showAllStatuses />
    </div>
  );
};
