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
        <div className="relative font-roboto" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border ${
                    isOpen 
                        ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20' 
                        : 'border-[#dadce0] dark:border-[#5f6368] hover:border-[#1a73e8]/60'
                } rounded-xl text-[13px] font-medium text-[#3c4043] dark:text-slate-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs`}
                title="Sütunları Yönet"
            >
                <span className="material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400">view_column</span>
                <span>Sütunlar</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-[#28292c] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] z-[100] p-3.5 flex flex-col gap-2.5 animate-in fade-in duration-150 font-roboto">
                    <div className="flex items-center justify-between pb-2 border-b border-[#dadce0] dark:border-[#3c4043]">
                        <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                            Aktif Sütunlar ({columns.length})
                        </span>
                        <span className="text-[10px] text-[#70757a] dark:text-slate-400">
                            Sıralamak için sürükle
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-0.5">
                        {columns.map((col, index) => (
                            <div 
                                key={col} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragOver={handleDragOver}
                                className="flex items-center justify-between px-2.5 py-1.5 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/60 dark:border-[#3c4043]/60 rounded-xl cursor-grab active:cursor-grabbing hover:border-[#1a73e8]/50 transition-colors group"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <span className="material-symbols-outlined text-[#70757a] group-hover:text-[#1a73e8] text-[16px]">drag_indicator</span>
                                    <span className="text-[13px] font-medium text-[#202124] dark:text-slate-200 truncate">{col}</span>
                                </div>
                                <button 
                                    onClick={() => toggleColumn(col)}
                                    className="size-6 flex items-center justify-center text-rose-500 hover:text-rose-700 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                                    title="Sütunu Kaldır"
                                >
                                    <span className="material-symbols-outlined text-[15px]">close</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#dadce0] dark:border-[#3c4043] pb-1">
                        <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                            Kullanılabilir Sütunlar
                        </span>
                    </div>

                    <div className="flex flex-col gap-1 max-h-44 overflow-y-auto custom-scrollbar pr-0.5">
                        {availableColumns.filter(c => !columns.includes(c)).map(col => (
                            <div 
                                key={col} 
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[#f1f3f4] dark:hover:bg-[#383a3e] transition-colors"
                            >
                                <span className="text-[13px] font-normal text-[#5f6368] dark:text-slate-300 truncate">{col}</span>
                                <button 
                                    onClick={() => toggleColumn(col)}
                                    className="size-6 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition-colors"
                                    title="Sütunu Ekle"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
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
