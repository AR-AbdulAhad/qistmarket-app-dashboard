import { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import CustomerList from '@/components/CustomerList/CustomerList';

export const metadata: Metadata = {
    title: 'Customers | Qistmarket Admin',
    description: 'Manage customers across all your orders in Qistmarket',
};

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
