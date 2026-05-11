import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function ExpiredOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Expired Orders" />
            <OrderList forcedStatus="expired" hideSelection />
        </div>
    );
}
