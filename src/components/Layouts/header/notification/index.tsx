"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BellIcon } from "./icons";
import { useNotifications } from "../../../../../contexts/NotificationContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);
      }}
    >
      <DropdownTrigger
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />

          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -right-3 -top-5 z-1 flex size-5 items-center justify-center rounded-full bg-red-light text-[10px] font-bold text-white ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md dark:border-dark-3 dark:bg-gray-dark min-[350px]:min-w-[22rem]"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5 border-b border-stroke dark:border-dark-3 pb-3">
          <span className="text-lg font-medium text-dark dark:text-white">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="rounded-md bg-primary px-[9px] py-0.5 text-xs font-medium text-white">
              {unreadCount} new
            </span>
          )}
        </div>

        <ul className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto pt-2">
          {notifications.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-dark-5 dark:text-dark-6">
              No notifications yet
            </li>
          ) : (
            notifications.slice(0, 5).map((item, index) => (
              <li key={item.id || `header-notif-${index}`} role="menuitem">
                <Link
                  href="/notifications"
                  onClick={() => {
                    setIsOpen(false);
                    if (!item.isRead) markAsRead(item.id);
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-lg px-2 py-2 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3 transition-colors",
                    !item.isRead && "bg-blue-light-5 dark:bg-dark-4/40"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <strong className="block text-sm font-semibold text-dark dark:text-white truncate">
                      {item.title}
                    </strong>

                    <span className="block text-sm text-dark-5 dark:text-dark-6 line-clamp-2">
                      {item.message}
                    </span>

                    <span className="text-[10px] text-dark-6 dark:text-dark-7 mt-1 block">
                      {dayjs(item.createdAt).fromNow()}
                    </span>
                  </div>
                  {!item.isRead && (
                    <span className="size-2 rounded-full bg-primary shrink-0" />
                  )}
                </Link>
              </li>
            ))
          )}
        </ul>

        <Link
          href="/notifications"
          onClick={() => setIsOpen(false)}
          className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary outline-none transition-colors hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
        >
          See all notifications
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
