import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function PaytriggerPendingOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Waiting PayTrigger Approval" />
            <Suspense fallback={<div>Loading orders...</div>}>
                <OrderList forcedStatus="awaiting_paytrigger_enrollment" hideSelection />
            </Suspense>
        </div>
    );
};
