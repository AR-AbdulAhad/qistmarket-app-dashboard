'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from '@/assets/icons';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false,
}) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showMax = 7; // Max buttons to show before using more ellipses

        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logic for ellipses
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className="flex items-center">
            <button
                className="flex items-center justify-center rounded-[3px] p-[7px] hover:bg-[#ff3d3d] hover:text-white disabled:pointer-events-none disabled:opacity-50"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
            >
                <ChevronLeft width={18} height={18} />
            </button>

            {pages.map((page, index) => (
                <React.Fragment key={index}>
                    {page === '...' ? (
                        <span className="mx-1 flex h-8 w-8 items-center justify-center text-gray-500">
                            ...
                        </span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page as number)}
                            className={cn(
                                'mx-1 flex items-center justify-center rounded-[3px] p-1.5 px-[15px] font-medium transition-all hover:bg-[#ff3d3d] hover:bg-opacity-90 hover:text-white',
                                currentPage === page
                                    ? 'bg-[#ff3d3d] text-white shadow-md'
                                    : 'bg-gray-2 text-dark dark:bg-dark-3 dark:text-white',
                                isLoading && 'pointer-events-none opacity-50'
                            )}
                            disabled={isLoading}
                        >
                            {page}
                        </button>
                    )}
                </React.Fragment>
            ))}

            <button
                className="flex items-center justify-center rounded-[3px] p-[7px] hover:bg-[#ff3d3d] hover:text-white disabled:pointer-events-none disabled:opacity-50"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isLoading}
            >
                <ChevronRight width={18} height={18} />
            </button>
        </div>
    );
};

export default Pagination;
