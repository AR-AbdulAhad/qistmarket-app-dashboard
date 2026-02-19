import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DeletionRequestsTable from "@/components/Admin/DeletionRequests/DeletionRequestTable";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Account Deletion Requests | NextAdminHQ",
    description: "Manage account deletion requests",
};

export default function DeletionRequestsPage() {
    return (
        <>
            <Breadcrumb pageName="Account Deletion Requests" />
            <div className="flex flex-col gap-10">
                <DeletionRequestsTable />
            </div>
        </>
    );
}
