import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ClearedCustomerList from '@/components/Cleared/ClearedCustomerList';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cleared Accounts | QistMarket',
    description: 'View customers who have successfully completed all installment payments.',
};

const ClearedAccountsPage = () => {
    return (
        <>
            <Breadcrumb pageName="Cleared Accounts" />
            <div className="flex flex-col gap-10">
                <ClearedCustomerList />
            </div>
        </>
    );
};

export default ClearedAccountsPage;
