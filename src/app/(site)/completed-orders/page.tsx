import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function CompletedOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Completed Orders" />
            <OrderList forcedStatus="completed" hideActions hideSelection />
        </div>
    );
};
