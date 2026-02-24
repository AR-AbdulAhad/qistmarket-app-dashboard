import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function DeliveredOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Delivered Orders" />
            <OrderList forcedStatus="delivered" hideActions hideSelection />
        </div>
    );
};
