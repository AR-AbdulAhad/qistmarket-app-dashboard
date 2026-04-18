import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Orders",
        icon: Icons.CreateOrderSquareIcon,
        items: [
          {
            title: "Create Orders",
            url: "/create-orders",
          },
          {
            title: "Order List",
            url: "/orders-list",
          },
          {
            title: "Pending Orders",
            url: "/pending-orders",
          },
          {
            title: "In Progress Orders",
            url: "/in-progress-orders",
          },
          {
            title: "Cancelled Orders",
            url: "/cancelled-orders",
          },
          {
            title: "Completed Orders",
            url: "/completed-orders",
          },
          {
            title: "Delivered Orders",
            url: "/delivered-orders",
          },
          {
            title: "Expired Orders",
            url: "/expired-orders",
          }
        ],
      },
      {
        title: "Customers Profiles",
        icon: Icons.UsersIcon,
        url: "/admin/customers",
        items: [],
      },
      {
        title: "Blacklisted Accounts",
        icon: Icons.BanIcon,
        url: "/admin/customers/blacklist",
        items: [],
      },
      {
        title: "Cleared Accounts",
        icon: Icons.CheckCircleIcon,
        url: "/admin/customers/cleared",
        items: [],
      },
      {
        title: "Orders for Approval",
        icon: Icons.ClipboardCheckIcon,
        url: "/orders-for-approval",
        items: [],
      },
      {
        title: "Approved Order List",
        icon: Icons.ArchiveIcon,
        items: [],
      },
      {
        title: "Recovery Orders",
        icon: Icons.RotateCcwIcon,
        items: [],
      },
      {
        title: "Delivery Officers",
        icon: Icons.TruckIcon,
        items: [
          {
            title: "Officer List",
            url: "/delivery-officers",
          },
          {
            title: "Area Assignments",
            url: "/admin/delivery-assignments",
          },
        ],
      },
      {
        title: "Verification Officers",
        icon: Icons.ShieldCheckIcon,
        items: [
          {
            title: "Officer List",
            url: "/verification-officers",
          },
          {
            title: "Area Assignments",
            url: "/admin/officer-assignments",
          },
        ],
      },
      {
        title: "Recovery Officers",
        icon: Icons.UserCircleIcon,
        items: [
          {
            title: "Officer List",
            url: "/recovery-officers",
          },
          {
            title: "Area Assignments",
            url: "/admin/recovery-assignments",
          },
        ],
      },
      {
        title: "Notifications",
        icon: Icons.BellIcon,
        url: "/notifications",
        items: [],
      },
      {
        title: "User Management",
        icon: Icons.UserPlusIcon,
        items: [
          {
            title: "Create Users",
            url: "/user-management/create-users",
          },
          {
            title: "User List",
            url: "/user-management/user-list",
          },
        ],
      },
      {
        title: "Address Management",
        icon: Icons.MapPinIcon,
        items: [
          {
            title: "Cities",
            url: "/admin/addresses/cities",
          },
          {
            title: "Zones",
            url: "/admin/addresses/zones",
          },
          {
            title: "Areas",
            url: "/admin/addresses/areas",
          },
          {
            title: "Bulk Upload",
            url: "/admin/addresses/bulk-upload",
          },
        ],
      },
      {
        title: "Complaints",
        icon: Icons.MessageSquareIcon,
        items: [
          {
            title: "Create Complaint",
            url: "/admin/complaints",
          },
          {
            title: "All Complaints",
            url: "/admin/complaints/all",
          },
        ],
      },
      {
        title: "Reports",
        icon: Icons.BarChartIcon,
        url: "/reports",
        items: [],
      },
    ],
  },
  {
    label: "CSR PORTAL",
    items: [
      {
        title: "CSR Dashboard",
        icon: Icons.LayoutDashboardIcon,
        url: "/csr/dashboard",
        items: [],
      },
      {
        title: "Orders",
        icon: Icons.CreateOrderSquareIcon,
        items: [
          {
            title: "Create Orders",
            url: "/csr/create-order",
          },
          {
            title: "Order List",
            url: "/orders-list",
          },
          {
            title: "Pending Orders",
            url: "/pending-orders",
          },
          {
            title: "In Progress Orders",
            url: "/in-progress-orders",
          },
          {
            title: "Cancelled Orders",
            url: "/cancelled-orders",
          },
          {
            title: "Completed Orders",
            url: "/completed-orders",
          },
          {
            title: "Delivered Orders",
            url: "/delivered-orders",
          },
          {
            title: "Expired Orders",
            url: "/expired-orders",
          }
        ],
      },
      {
        title: "Website Orders",
        icon: Icons.GlobeIcon,
        url: "/csr/website-orders",
        items: [],
      },
      {
        title: "Customers Profiles",
        icon: Icons.UsersIcon,
        url: "/admin/customers",
        items: [],
      },
      {
        title: "Blacklisted Accounts",
        icon: Icons.BanIcon,
        url: "/admin/customers/blacklist",
        items: [],
      },
      {
        title: "Cleared Accounts",
        icon: Icons.CheckCircleIcon,
        url: "/admin/customers/cleared",
        items: [],
      },
      {
        title: "Notifications",
        icon: Icons.BellIcon,
        url: "/notifications",
        items: [],
      },
      {
        title: "Complaints",
        icon: Icons.MessageSquareIcon,
        url: "/csr/complaints",
        items: [],
      },
    ],
  },
  {
    label: "OUTLET PORTAL",
    items: [
      {
        title: "Outlet Dashboard",
        icon: Icons.StoreIcon,
        url: "/outlet/dashboard",
        items: [],
      },
      {
        title: "Orders",
        icon: Icons.CreateOrderSquareIcon,
        items: [
          {
            title: "Create Orders",
            url: "/create-orders",
          },
          {
            title: "Order List",
            url: "/orders-list",
          },
          {
            title: "Pending Orders",
            url: "/pending-orders",
          },
          {
            title: "In Progress Orders",
            url: "/in-progress-orders",
          },
          {
            title: "Cancelled Orders",
            url: "/cancelled-orders",
          },
          {
            title: "Completed Orders",
            url: "/completed-orders",
          },
          {
            title: "Delivered Orders",
            url: "/delivered-orders",
          },
          {
            title: "Expired Orders",
            url: "/expired-orders",
          }
        ],
      },
      {
        title: "Customers Profiles",
        icon: Icons.UsersIcon,
        url: "/admin/customers",
        items: [],
      },
      {
        title: "Approved Order List",
        icon: Icons.ArchiveIcon,
        items: [],
      },
      {
        title: "Recovery Orders",
        icon: Icons.RotateCcwIcon,
        items: [],
      },
      {
        title: "Inventory",
        icon: Icons.PackageIcon,
        items: [
          { title: "Stock List", url: "/outlet/inventory" },
          { title: "Stock Transfers", url: "/outlet/inventory/transfers" },
          { title: "Transfer History", url: "/outlet/inventory/transfers/history" },
        ],
      },
      {
        title: "Vendors",
        icon: Icons.HandshakeIcon,
        items: [
          { title: "Manage Vendors", url: "/outlet/vendors" },
          { title: "Vendor Purchases", url: "/outlet/vendors/purchases" },
          { title: "Vendor Payments", url: "/outlet/vendors/payments" },
        ],
      },
      {
        title: "Team Management",
        icon: Icons.UsersIcon,
        items: [
          { title: "Delivery Agents", url: "/outlet/delivery" },
          { title: "Recovery Officers", url: "/outlet/recovery" },
        ],
      },
      {
        title: "Expenses",
        icon: Icons.CreditCardIcon,
        url: "/outlet/expenses",
        items: [],
      },
      {
        title: "Cash Register",
        icon: Icons.CalculatorIcon,
        url: "/outlet/cash-register",
        items: [],
      },
      {
        title: "Cash In Hand",
        icon: Icons.BanknoteIcon,
        items: [
          { title: "Pending Collections", url: "/outlet/cash-in-hand" },
          { title: "Collection History", url: "/outlet/cash-in-hand/history" },
        ],
      },
      {
        title: "Returns",
        icon: Icons.UndoIcon,
        url: "/outlet/returns",
        items: [],
      },
      {
        title: "Installments",
        icon: Icons.HashIcon,
        url: "/outlet/installments",
        items: [],
      },
      {
        title: "Blacklisted Accounts",
        icon: Icons.BanIcon,
        url: "/admin/customers/blacklist",
        items: [],
      },
      {
        title: "Cleared Accounts",
        icon: Icons.CheckCircleIcon,
        url: "/admin/customers/cleared",
        items: [],
      },
      {
        title: "Notifications",
        icon: Icons.BellIcon,
        url: "/notifications",
        items: [],
      },
      {
        title: "Complaints",
        icon: Icons.MessageSquareIcon,
        url: "/outlet/complaints",
        items: [],
      },
      {
        title: "Outlet Reports",
        icon: Icons.FileTextIcon,
        url: "/outlet/reports",
        items: [],
      },
      {
        title: "Security Logs",
        icon: Icons.LockIcon,
        url: "/outlet/security-logs",
        items: [],
      },
    ],
  },
];
