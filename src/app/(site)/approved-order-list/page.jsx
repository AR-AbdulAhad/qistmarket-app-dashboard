import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ApprovedOrderList from "@/components/ApprovedOrderList/ApprovedOrderList";

export default function OrdersListPage() {
  return (
    <div>
      <Breadcrumb pageName="Approved Order List" />
      <Suspense fallback={<div>Loading approved orders...</div>}>
        <ApprovedOrderList />
      </Suspense>
    </div>
  );
};