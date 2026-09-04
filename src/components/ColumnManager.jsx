import React, { useState, useRef, useEffect } from 'react';

const ColumnManager = ({ columns, availableColumns, onColumnsChange, loading }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleColumn = (col) => {
        if (columns.includes(col)) {
            if (columns.length > 1) { // Prevent hiding all columns
                onColumnsChange(columns.filter(c => c !== col));
            }
        } else {
            onColumnsChange([...columns, col]);
        }
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('draggedIndex', index);
    };

    const handleDrop = (e, targetIndex) => {
        const draggedIndex = e.dataTransfer.getData('draggedIndex');
        if (draggedIndex === '' || draggedIndex === null) return;
        
        const newCols = [...columns];
        const [draggedCol] = newCols.splice(Number(draggedIndex), 1);
        newCols.splice(targetIndex, 0, draggedCol);
        onColumnsChange(newCols);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#dadce0] dark:border-[#5f6368] rounded-lg text-xs font-medium text-[#3c4043] dark:text-slate-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${isOpen ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20' : ''}`}
                title="Manage Columns"
            >
                <span className="material-symbols-outlined text-[18px] text-[#5f6368] dark:text-slate-400">view_column</span>
                Columns
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-lg shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] z-[100] p-3 flex flex-col gap-2 animate-in fade-in duration-150">
                    <div className="text-xs font-medium text-[#70757a] dark:text-slate-400 border-b border-[#dadce0] dark:border-slate-700 pb-2 mb-1">
                        Active Columns (Drag to reorder)
                    </div>
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {columns.map((col, index) => (
                            <div 
                                key={col} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragOver={handleDragOver}
                                className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-800 rounded cursor-grab hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-round text-slate-400 text-sm">drag_indicator</span>
                                    <span className="text-xs text-slate-700 dark:text-slate-300">{col}</span>
                                </div>
                                <button 
                                    onClick={() => toggleColumn(col)}
                                    className="material-icons-round text-red-500 hover:text-red-700 text-sm p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                    close
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 mt-2 mb-1">
                        Available Columns
                    </div>
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {availableColumns.filter(c => !columns.includes(c)).map(col => (
                            <div 
                                key={col}
                                className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <span className="text-xs text-slate-600 dark:text-slate-400">{col}</span>
                                <button 
                                    onClick={() => toggleColumn(col)}
                                    className="material-icons-round text-emerald-500 hover:text-emerald-700 text-sm p-0.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                >
                                    add
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColumnManager;
