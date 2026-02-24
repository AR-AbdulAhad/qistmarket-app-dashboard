import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function CancelledOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Cancelled Orders" />
            <OrderList forcedStatus="cancelled" hideActions hideSelection />
        </div>
    );
};
