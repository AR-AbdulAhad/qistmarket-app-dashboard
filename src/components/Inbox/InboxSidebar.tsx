import { TrashIcon } from "@/assets/icons";
import {
  ComposeIcon,
  DraftsIcon,
  InboxIcon,
  SentIcon,
  SnoozedIcon,
  SpamIcon,
  StartedIcon,
  ToggleIcon,
} from "@/components/Inbox/icons";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

const MENU_LIST = [
  {
    Icon: InboxIcon,
    title: "Inbox",
  },
  {
    Icon: StartedIcon,
    title: "Started",
  },
  {
    Icon: SnoozedIcon,
    title: "Snoozed",
  },
  {
    Icon: SentIcon,
    title: "Sent",
  },
  {
    Icon: DraftsIcon,
    title: "Drafts",
  },
  {
    Icon: SpamIcon,
    title: "Spam",
  },
  {
    Icon: TrashIcon,
    title: "Trash",
  },
];

const InboxSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  return (
    <div className="bottom-0 top-22.5 z-10 max-lg:fixed">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute z-10 block w-fit rounded-[7px] border border-stroke bg-white p-1.5 shadow-sm dark:border-dark-3 dark:bg-dark-2 lg:hidden ${
          isOpen && "left-full translate-x-2"
        }`}
      >
        <ToggleIcon />
      </button>

      <div
        ref={ref}
        className={cn(
          "h-full w-[230px] rounded-[7px] border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark max-lg:border lg:flex lg:flex-col",
          !isOpen && "max-lg:hidden",
        )}
      >
        <div className="px-4 pt-4">
          <button className="flex w-full items-center gap-2 rounded-[7px] bg-primary px-4 py-[9px] font-medium text-white">
            <ComposeIcon />
            Compose
          </button>
        </div>

        <div className="custom-scrollbar max-h-full overflow-auto px-4 py-5">
          <ul className="flex flex-col gap-1">
            {MENU_LIST.map(({ title, Icon }, index) => (
              <li key={index}>
                <Link
                  href="#"
                  className="relative flex items-center gap-2.5 rounded-[7px] px-2.5 py-[9px] font-medium text-dark-4 duration-300 ease-linear hover:bg-gray-2 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-2 dark:hover:text-white"
                >
                  <Icon />
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InboxSidebar;
