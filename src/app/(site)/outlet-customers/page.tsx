import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import RecoveryOrderList from "@/components/RecoveryOrderList/RecoveryOrderList";

export const metadata = {
    title: "Recovery Orders | Qist Market Dashboard",
};

const RecoveryOrdersPage = () => {
    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Recovery Orders (Delivered)" />
            <RecoveryOrderList />
        </div>
    );
};

export default RecoveryOrdersPage;
