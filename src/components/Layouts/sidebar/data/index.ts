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
            title: "Picked Orders",
            url: "/picked-orders",
          }
        ],
      },
      {
        title: "Customers",
        icon: Icons.HomeIcon,
        url: "/admin/customers",
        items: [],
      },
      {
        title: "Orders for Approval",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Approved Order List",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Recovery Orders",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Delivery Officers",
        icon: Icons.HomeIcon,
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
        icon: Icons.HomeIcon,
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
        icon: Icons.HomeIcon,
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
        icon: Icons.HomeIcon,
        url: "/notifications",
        items: [],
      },
      {
        title: "User Management",
        icon: Icons.HomeIcon,
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
        icon: Icons.HomeIcon,
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
        title: "Reports",
        icon: Icons.HomeIcon,
        url: "/reports",
        items: [],
      },
      // {
      //   title: "Case Assignment",
      //   url: "/calendar",
      //   icon: Icons.Calendar,
      //   items: [
      //      {
      //       title: "Assign Cases to Officers",
      //       url: "/",
      //     },
      //   ],
      // },
      // {
      //   title: "Live Location Tracking",
      //   url: "/",
      //   icon: Icons.User,
      //   items: [

      //      {
      //       title: "View Officer Live Location",
      //       url: "/tracker",
      //     },

      //      {
      //       title: "Today's Summary",
      //       url: "/",
      //     },

      //   ],
      // },
      // {
      //   title: "Verification Review",
      //   icon: Icons.Alphabet,
      //   items: [
      //     {
      //       title: "Open Submitted Verification Report",
      //       url: "/",
      //     },
      //     {
      //       title: "Check Customer Details",
      //       url: "/",
      //     },
      //   ],
      // },
    ],
  },
  {
    label: "OUTLET PORTAL",
    items: [
      {
        title: "Outlet Dashboard",
        icon: Icons.HomeIcon,
        url: "/outlet/dashboard",
        items: [],
      },
      {
        title: "Outlet Orders",
        icon: Icons.CreateOrderSquareIcon,
        url: "/outlet/orders",
        items: [],
      },
      {
        title: "Inventory",
        icon: Icons.HomeIcon,
        items: [
          { title: "Stock List", url: "/outlet/inventory" },
          { title: "Add Stock", url: "/outlet/inventory/add" },
          { title: "Stock Transfers", url: "/outlet/inventory/transfers" },
        ],
      },
      {
        title: "Vendors",
        icon: Icons.HomeIcon,
        items: [
          { title: "Vendor Purchases", url: "/outlet/vendors/purchases" },
          { title: "Vendor Payments", url: "/outlet/vendors/payments" },
        ],
      },
      {
        title: "Expenses",
        icon: Icons.HomeIcon,
        url: "/outlet/expenses",
        items: [],
      },
      {
        title: "Cash Register",
        icon: Icons.HomeIcon,
        url: "/outlet/cash-register",
        items: [],
      },
    ],
  },
];
