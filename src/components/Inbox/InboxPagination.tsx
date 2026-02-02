import { ArrowLeftIcon } from "./icons";

const InboxPagination = () => {
  return (
    <>
      <div className="flex items-center justify-between border-t border-stroke py-5.5 pl-11 pr-7.5 dark:border-dark-3">
        <p className="text-base font-medium text-dark dark:text-white">
          1-5 of 29
        </p>
        <div className="flex items-center justify-end space-x-3">
          <button className="flex h-7.5 w-7.5 items-center justify-center rounded border border-stroke bg-[#FAFBFF] hover:border-primary hover:bg-primary hover:text-white dark:border-dark-3 dark:bg-dark-2 dark:hover:border-primary dark:hover:bg-primary dark:hover:text-white">
            <span className="sr-only">Previous</span>
            <ArrowLeftIcon />
          </button>
          <button className="flex h-7.5 w-7.5 items-center justify-center rounded border border-stroke bg-[#FAFBFF] hover:border-primary hover:bg-primary hover:text-white dark:border-dark-3 dark:bg-dark-2 dark:hover:border-primary dark:hover:bg-primary dark:hover:text-white">
            <span className="sr-only">Next</span>
            <ArrowLeftIcon className="rotate-180" />
          </button>
        </div>
      </div>
    </>
  );
};

export default InboxPagination;
