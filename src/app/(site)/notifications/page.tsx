"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useNotifications } from "../../../../contexts/NotificationContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { cn } from "@/lib/utils";
import { CheckCheck, Trash2, Bell, BellOff } from "lucide-react";

dayjs.extend(relativeTime);

const NotificationsPage = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Notifications" />

            <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
                <div className="flex items-center justify-between border-b border-stroke px-4 py-4 dark:border-dark-3 sm:px-6 md:px-7.5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-dark dark:text-white">
                            All Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-white">
                                {unreadCount} Unread
                            </span>
                        )}
                    </div>

                    {notifications.length > 0 && unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                            <CheckCheck size={18} />
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="p-4 sm:p-6 md:p-7.5">
                    {loading && notifications.length === 0 ? (
                        <div className="flex h-60 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-gray-2 dark:bg-dark-3">
                                <BellOff size={40} className="text-dark-6" />
                            </div>
                            <h4 className="mb-1 text-xl font-semibold text-dark dark:text-white">
                                No notifications yet
                            </h4>
                            <p className="text-dark-6">
                                We'll notify you when something important happens.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={cn(
                                        "relative flex gap-4 rounded-xl border border-stroke p-4 transition-all dark:border-dark-3",
                                        notif.isRead
                                            ? "bg-transparent"
                                            : "bg-blue-light-5/30 border-primary/20 dark:bg-primary/5 dark:border-primary/20 shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "flex size-12 shrink-0 items-center justify-center rounded-full",
                                        notif.isRead ? "bg-gray-2 dark:bg-dark-3" : "bg-primary/10 text-primary"
                                    )}>
                                        <Bell size={24} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h5 className={cn(
                                                    "text-base font-semibold",
                                                    notif.isRead ? "text-dark dark:text-white" : "text-primary dark:text-white"
                                                )}>
                                                    {notif.title}
                                                </h5>
                                                <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
                                                    {notif.message}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="block text-xs text-dark-6 dark:text-dark-7">
                                                    {dayjs(notif.createdAt).format("MMM DD, YYYY")}
                                                </span>
                                                <span className="mt-1 block text-[10px] text-dark-6 dark:text-dark-7">
                                                    {dayjs(notif.createdAt).fromNow()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-end gap-4">
                                            {!notif.isRead && (
                                                <button
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="text-xs font-semibold text-primary hover:underline"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
