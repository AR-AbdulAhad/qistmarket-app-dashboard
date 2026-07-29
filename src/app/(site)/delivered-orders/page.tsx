import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function DeliveredOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Delivered Orders" />
            <OrderList forcedStatus="delivered" apiEndpoint="/api/orders/delivered-list" hideActions hideSelection />
        </div>
    );
};
