import { SearchIcon, TrashIcon } from "@/assets/icons";
import {
  CheckMarkIcon,
  CircleEllipsisHorizontal,
  FilterIcon,
  RefreshIcon,
} from "./icons";

const InboxHeader = () => {
  return (
    <>
      <div className="flex flex-col-reverse justify-between gap-6 py-4.5 pl-4 pr-4 sm:flex-row lg:pl-10 lg:pr-7.5">
        <div className="flex items-center gap-4">
          <label
            htmlFor="checkboxAll"
            className="flex cursor-pointer select-none items-center font-medium"
          >
            <div className="relative">
              <input
                type="checkbox"
                id="checkboxAll"
                className="tableCheckbox sr-only"
              />

              <div className="box flex h-4 w-4 items-center justify-center rounded-[3px] border border-stroke text-white dark:border-dark-3">
                <span className="opacity-0">
                  <CheckMarkIcon />
                </span>
              </div>
            </div>
          </label>

          <button className="hover:text-primary">
            <span className="sr-only">Delete</span>
            <TrashIcon className="size-5" />
          </button>

          <button className="hover:text-primary">
            <span className="sr-only">Refresh</span>
            <RefreshIcon />
          </button>

          <button className="hover:text-primary">
            <span className="sr-only">View more</span>
            <CircleEllipsisHorizontal />
          </button>
        </div>

        <div className="relative z-1 w-full max-w-[345px]">
          <button className="absolute left-0 top-1/2 z-1 -translate-y-1/2 hover:text-primary">
            <SearchIcon className="size-4" />
          </button>

          <input
            type="text"
            placeholder="Search for user, email address..."
            className="w-full bg-transparent pl-7 pr-8 font-medium outline-none placeholder:!text-dark-5 dark:placeholder:text-current dark:placeholder:opacity-75"
          />

          <button className="absolute right-0 top-1/2 -translate-y-1/2 hover:text-primary">
            <FilterIcon />
          </button>
        </div>
      </div>
    </>
  );
};

export default InboxHeader;
