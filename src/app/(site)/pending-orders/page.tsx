import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function PendingOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Pending Orders" />
            <OrderList forcedStatus="pending" hideActions hideSelection />
        </div>
    );
};
