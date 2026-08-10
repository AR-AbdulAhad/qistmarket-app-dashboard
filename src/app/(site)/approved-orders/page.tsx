import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function ApprovedOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Approved Orders" />
            <Suspense fallback={<div>Loading approved orders...</div>}>
                <OrderList forcedStatus="approved" />
            </Suspense>
        </div>
    );
};
