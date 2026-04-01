import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import CustomerList from '@/components/CustomerList/CustomerList';

const CustomersPage = () => {
    return (
        <>
            <Breadcrumb pageName="Customers" />
            <div className="flex flex-col gap-10">
                <CustomerList />
            </div>
        </>
    );
};

export default CustomersPage;
