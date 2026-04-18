"use client";
import Image from "next/image";
import Link from "next/link";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
// import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import GlobalSearch from "../../common/GlobalSearch";


export function Header() {
  const { toggleSidebar, isMobile, isOpen } = useSidebarContext();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-4 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      {/* Left side: Menu, Logo, and Title */}
      <div className="flex items-center gap-4 md:gap-5">
        <button
          onClick={toggleSidebar}
          className="rounded-lg border border-stroke p-2 text-dark hover:bg-gray-2 dark:border-stroke-dark dark:bg-[#000000] dark:text-white hover:dark:bg-[#FFFFFF1A] transition-colors"
        >
          <MenuIcon />
          <span className="sr-only">Toggle Sidebar</span>
        </button>

        {(!isOpen || isMobile) && (
          <Link href={"/"} className="max-[430px]:hidden shrink-0">
            <Image
              src={"/images/logo/single-logo.png"}
              width={32}
              height={32}
              alt="Logo"
              role="presentation"
            />
          </Link>
        )}

        <div className="hidden lg:block lg:ml-2">
          <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm font-medium text-dark-4 dark:text-dark-6">Qist Market Management System</p>
        </div>

        {/* Global Search Centerpiece */}
        <div className="hidden min-[1100px]:block flex-1 max-w-2xl px-8">
            <GlobalSearch />
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center justify-end gap-3 md:gap-4">
        {/* <ThemeToggleSwitch /> */}
        <Notification />
        <UserInfo />
      </div>
    </header>
  );
}
