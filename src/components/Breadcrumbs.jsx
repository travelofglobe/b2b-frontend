import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumbs = () => {
    return (
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link className="text-slate-400 dark:text-slate-500 hover:text-primary text-sm font-medium" to="/">Home</Link>
            <span className="material-symbols-outlined text-slate-400 text-xs">chevron_right</span>
            <a className="text-slate-400 dark:text-slate-500 hover:text-primary text-sm font-medium" href="#">Europe</a>
            <span className="material-symbols-outlined text-slate-400 text-xs">chevron_right</span>
            <a className="text-slate-400 dark:text-slate-500 hover:text-primary text-sm font-medium" href="#">Greece</a>
            <span className="material-symbols-outlined text-slate-400 text-xs">chevron_right</span>
            <span className="text-slate-900 dark:text-white text-sm font-semibold">Santorini Hotels</span>
        </div>
    );
};

export default Breadcrumbs;
