import React from 'react';

const Pagination = ({ currentPage = 1, totalPages = 12 }) => {
    return (
        <div className="mt-12 flex justify-center items-center gap-2">
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#233648] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="size-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold">1</button>
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#233648] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-bold">2</button>
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#233648] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-bold">3</button>
            <span className="px-2 text-slate-400">...</span>
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#233648] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-bold">12</button>
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#233648] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
            </button>
        </div>
    );
};

export default Pagination;
