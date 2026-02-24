import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function PickedOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="Picked Orders" />
            <OrderList forcedStatus="picked" hideActions hideSelection />
        </div>
    );
};
