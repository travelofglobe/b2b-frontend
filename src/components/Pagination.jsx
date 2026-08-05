import React, { useState } from 'react';

const Pagination = ({
    currentPage = 0,
    totalPages = 1,
    pageSize = 10,
    totalElements = 0,
    onPageChange,
    onPageSizeChange
}) => {
    const [pageInput, setPageInput] = useState('');

    const handleChangePage = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            onPageChange(newPage);
        }
    };

    const handleChangeRowsPerPage = (e) => {
        const newSize = parseInt(e.target.value, 10);
        if (onPageSizeChange) {
            onPageSizeChange(newSize);
        }
    };

    const handlePageInputSubmit = (e) => {
        e.preventDefault();
        const pageNum = parseInt(pageInput, 10);
        if (pageNum >= 1 && pageNum <= totalPages) {
            onPageChange(pageNum - 1);
            setPageInput('');
        }
    };

    const from = totalElements === 0 ? 0 : currentPage * pageSize + 1;
    const to = Math.min((currentPage + 1) * pageSize, totalElements);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(0);

            let startPage = Math.max(1, currentPage - 1);
            let endPage = Math.min(totalPages - 2, currentPage + 1);

            if (currentPage < 2) {
                endPage = Math.min(totalPages - 2, 3);
            }

            if (currentPage > totalPages - 3) {
                startPage = Math.max(1, totalPages - 4);
            }

            if (startPage > 1) {
                pages.push('ellipsis-start');
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages - 2) {
                pages.push('ellipsis-end');
            }

            pages.push(totalPages - 1);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="shrink-0 px-4 py-2.5 border-t border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 select-none">
            {/* Left: Rows per page & Range */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Göster:</span>
                <select
                    value={pageSize}
                    onChange={handleChangeRowsPerPage}
                    className="h-8 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-primary transition-colors"
                >
                    {[5, 10, 25, 50].map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
                    {from}-{to} / <strong className="text-slate-800 dark:text-slate-200">{totalElements}</strong>
                </span>
            </div>

            {/* Center: Page numbers navigation */}
            <div className="flex items-center gap-1">
                {/* First page button */}
                <button
                    type="button"
                    onClick={() => handleChangePage(0)}
                    disabled={currentPage === 0}
                    className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-slate-600 dark:text-slate-300"
                    title="İlk Sayfa"
                >
                    <span className="material-icons-round text-sm">first_page</span>
                </button>

                {/* Previous button */}
                <button
                    type="button"
                    onClick={() => handleChangePage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-slate-600 dark:text-slate-300"
                    title="Önceki Sayfa"
                >
                    <span className="material-icons-round text-sm">chevron_left</span>
                </button>

                {/* Page Numbers */}
                {pageNumbers.map((page, index) => {
                    if (typeof page === 'string') {
                        return (
                            <div key={page} className="size-8 flex items-center justify-center text-slate-400">
                                <span className="material-icons-round text-sm">more_horiz</span>
                            </div>
                        );
                    }

                    const isActive = page === currentPage;
                    return (
                        <button
                            key={page}
                            type="button"
                            onClick={() => handleChangePage(page)}
                            className={`size-8 rounded-lg text-xs font-bold transition-all ${
                                isActive
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            {page + 1}
                        </button>
                    );
                })}

                {/* Next button */}
                <button
                    type="button"
                    onClick={() => handleChangePage(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-slate-600 dark:text-slate-300"
                    title="Sonraki Sayfa"
                >
                    <span className="material-icons-round text-sm">chevron_right</span>
                </button>

                {/* Last page button */}
                <button
                    type="button"
                    onClick={() => handleChangePage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-slate-600 dark:text-slate-300"
                    title="Son Sayfa"
                >
                    <span className="material-icons-round text-sm">last_page</span>
                </button>
            </div>

            {/* Right: Jump to page input */}
            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sayfa:</span>
                <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder={(currentPage + 1).toString()}
                    className="w-12 h-8 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-primary transition-colors"
                />
                <button
                    type="submit"
                    className="h-8 px-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                >
                    Git
                </button>
            </form>
        </div>
    );
};

export default Pagination;
