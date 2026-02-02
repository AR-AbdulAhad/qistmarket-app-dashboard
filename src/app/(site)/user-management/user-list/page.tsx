import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import UsersTable from "@/components/UserList/UserTable";

export default function UserListPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="User List" />
        <UsersTable />
    </div>
  );
};

