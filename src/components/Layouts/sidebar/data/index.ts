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
          },
        ],
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
        title: "Delivery Officers",
        icon: Icons.HomeIcon,
        items: [],
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
          {
            title: "Deletion Requests",
            url: "/admin/deletion-requests",
          },
        ],
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

];
