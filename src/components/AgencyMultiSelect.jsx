import React, { useState, useRef, useEffect } from 'react';
import { agencyService } from '../services/agencyService';

const AgencyMultiSelect = ({ selectedValues, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        let mounted = true;
        const fetchAgencies = async () => {
            try {
                setLoading(true);
                const response = await agencyService.getAgencies();
                if (mounted && Array.isArray(response)) {
                    // Filter out duplicate IDs just in case, sort by name
                    const sortedAgencies = response.sort((a, b) => 
                        (a.name || '').localeCompare(b.name || '')
                    );
                    setAgencies(sortedAgencies);
                }
            } catch (error) {
                console.error("Failed to fetch agencies", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchAgencies();

        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value) => {
        const numericValue = Number(value);
        const newValues = selectedValues.includes(numericValue)
            ? selectedValues.filter(v => v !== numericValue)
            : [...selectedValues, numericValue];
        onChange(newValues);
    };

    const getDisplayText = () => {
        if (!selectedValues || selectedValues.length === 0) return 'Agency';
        if (selectedValues.length === 1) {
            const agency = agencies.find(a => a.id === selectedValues[0]);
            return agency ? agency.name : '1 Selected';
        }
        return `${selectedValues.length} Selected`;
    };

    const filteredAgencies = agencies.filter(agency => 
        (agency.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-8 bg-white dark:bg-[#303134] border ${isOpen ? 'border-[#1a73e8] ring-1 ring-[#1a73e8]' : 'border-[#dadce0] dark:border-[#3c4043]'} rounded-lg py-1 px-2.5 text-[13px] font-normal flex items-center justify-between transition-all outline-none text-[#202124] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] cursor-pointer`}
            >
                <span className="truncate">{getDisplayText()}</span>
                <span className={`material-symbols-outlined text-[18px] text-[#70757a] dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>arrow_drop_down</span>
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-lg shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] z-[100] overflow-hidden min-w-[280px] w-max max-w-[340px] animate-in fade-in slide-in-from-top-1 duration-150 font-roboto">
                    <div className="p-2 border-b border-[#dadce0] dark:border-[#3c4043]">
                        <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-2 text-[#70757a] dark:text-slate-400 text-[18px]">search</span>
                            <input
                                type="text"
                                placeholder="Acente ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] rounded-md py-1.5 pl-8 pr-2.5 text-[13px] font-normal text-[#202124] dark:text-white placeholder-[#70757a] outline-none focus:border-[#1a73e8]"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="p-1 max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="p-3 text-center text-[13px] text-[#70757a]">Yükleniyor...</div>
                        ) : filteredAgencies.length === 0 ? (
                            <div className="p-3 text-center text-[13px] text-[#70757a]">Acente bulunamadı</div>
                        ) : (
                            filteredAgencies.map((agency) => {
                                const isSelected = selectedValues.includes(agency.id);
                                return (
                                    <div
                                        key={agency.id}
                                        onClick={() => toggleOption(agency.id)}
                                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded transition-colors text-[13px] font-normal ${
                                            isSelected 
                                                ? 'bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#202124] dark:text-white' 
                                                : 'hover:bg-[#f1f3f4] dark:hover:bg-[#303134] text-[#3c4043] dark:text-slate-300'
                                        }`}
                                    >
                                        <div className="w-6 flex items-center justify-center flex-shrink-0">
                                            {isSelected && <span className="material-symbols-outlined text-[18px] text-[#3c4043] dark:text-slate-200">check</span>}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 flex-1 overflow-hidden">
                                            <span className="truncate">{agency.name}</span>
                                            {agency.agencyType && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide shrink-0 ${
                                                    agency.agencyType === 'GSA' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40' : 
                                                    agency.agencyType === 'RSA' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40' : 
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/40'
                                                }`}>
                                                    {agency.agencyType}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgencyMultiSelect;
