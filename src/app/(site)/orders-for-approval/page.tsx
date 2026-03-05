import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import VerificationList from "@/components/VerificationList/VerificationTable";

export default function OrdersAprovalListPage() {
  return (
    <div>
      <Breadcrumb pageName="Orders List" />
        <VerificationList />
    </div>
  );
};