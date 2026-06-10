"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, User, Clock, Calendar, Wallet, Banknote,
  FileText, Bell, TrendingUp, History, LogOut, Menu, X,
} from "lucide-react";
import { useEmployeeAuth } from "../../../contexts/EmployeeAuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

const NAV = [
  { title: "Dashboard", url: "/employee/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/employee/profile", icon: User },
  { title: "Timeline", url: "/employee/timeline", icon: History },
  { title: "Attendance", url: "/employee/attendance", icon: Clock },
  { title: "Payroll", url: "/employee/payroll", icon: Wallet },
  { title: "Loans", url: "/employee/loans", icon: Banknote },
  { title: "Leaves", url: "/employee/leaves", icon: Calendar },
  { title: "Notifications", url: "/employee/notifications", icon: Bell },
  { title: "Documents", url: "/employee/documents", icon: FileText },
  { title: "Performance", url: "/employee/performance", icon: TrendingUp },
];

export function EmployeeSidebar() {
  const pathname = usePathname();
  const { user, logout } = useEmployeeAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/employee/login");
  };

  const NavContent = () => (
    <>
      <div className="border-b border-stroke px-6 py-5 dark:border-stroke-dark">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">QIST Market</p>
        <p className="mt-1 text-lg font-bold text-dark dark:text-white">Employee Portal</p>
        {user && (
          <p className="mt-2 truncate text-sm text-gray-500">{user.full_name}</p>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-dark-5 hover:bg-gray-2 dark:text-gray-6 dark:hover:bg-dark-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-stroke p-4 dark:border-stroke-dark">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red hover:bg-red/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden dark:bg-dark-2"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-stroke bg-white dark:border-stroke-dark dark:bg-dark-2 lg:flex">
        <NavContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-white dark:bg-dark-2">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
