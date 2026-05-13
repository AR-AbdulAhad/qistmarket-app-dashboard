import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function CancelledOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Approved Orders" />
            <OrderList forcedStatus="approved" />
        </div>
    );
};
