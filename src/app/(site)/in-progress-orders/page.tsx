import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";

export default function InProgressOrdersPage() {
    return (
        <div>
            <Breadcrumb pageName="In Progress Orders" />
            <OrderList forcedStatus="in_progress" />
        </div>
    );
};
