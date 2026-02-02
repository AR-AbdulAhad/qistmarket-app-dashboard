"use client";
import InboxHeader from "@/components/Inbox/InboxHeader";
import InboxList from "@/components/Inbox/InboxList";
import InboxPagination from "@/components/Inbox/InboxPagination";
import InboxSidebar from "@/components/Inbox/InboxSidebar";
import React from "react";

const Inbox: React.FC = () => {
  return (
    <>
      <div className="h-[calc(100vh-186px)] overflow-hidden sm:h-[calc(100vh-174px)]">
        <div className="h-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card lg:flex">
          <InboxSidebar />

          <div className="flex h-full flex-col border-stroke dark:border-dark-3 lg:w-4/5 lg:border-l">
            <InboxHeader />

            <div className="h-full">
              <InboxList />
            </div>

            <InboxPagination />
          </div>
        </div>
      </div>
    </>
  );
};

export default Inbox;
