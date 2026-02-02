import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";
import VerificationList from "@/components/VerificationList/VerificationTable";

export default function OrdersAprovalListPage() {
  return (
    <div  className="">
      <Breadcrumb pageName="Orders List" />
        <VerificationList />
    </div>
  );
};