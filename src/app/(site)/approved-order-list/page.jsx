import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ApprovedOrderList from "@/components/ApprovedOrderList/ApprovedOrderList";

export default function OrdersListPage() {
  return (
    <div>
      <Breadcrumb pageName="Approved Order List" />
        <ApprovedOrderList />
    </div>
  );
};