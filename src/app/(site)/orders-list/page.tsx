import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function OrdersListPage() {
  return (
    <div>
      <Breadcrumb pageName="Orders List" />
        <OrderList />
    </div>
  );
};