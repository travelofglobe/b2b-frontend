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
                className={`w-full bg-white/20 dark:bg-slate-800/40 border ${isOpen ? 'border-primary/50 ring-2 ring-primary/20 bg-white/40' : 'border-white/40 dark:border-white/5'} rounded-xl py-1.5 px-2 text-xs font-semibold flex items-center justify-between transition-all outline-none text-slate-700 dark:text-slate-200`}
            >
                <span className="truncate">{getDisplayText()}</span>
                <span className={`material-icons-round text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden min-w-[280px] w-max max-w-[340px] animate-in fade-in slide-in-from-top-2">
                    <div className="p-1.5 border-b border-slate-100 dark:border-slate-800">
                        <input
                            type="text"
                            placeholder="Search agency..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2.5 text-xs font-normal text-slate-700 dark:text-slate-200 outline-none focus:border-primary/50"
                        />
                    </div>
                    <div className="p-1 max-h-64 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-3 text-center text-xs text-slate-500">Loading...</div>
                        ) : filteredAgencies.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-500">No agency found</div>
                        ) : (
                            filteredAgencies.map((agency) => {
                                const isSelected = selectedValues.includes(agency.id);
                                return (
                                    <div
                                        key={agency.id}
                                        onClick={() => toggleOption(agency.id)}
                                        className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer rounded-lg transition-colors ${isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-medium'}`}
                                    >
                                        <div className={`size-3.5 rounded border flex flex-shrink-0 items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {isSelected && <span className="material-icons-round text-[9px]">check</span>}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 flex-1 overflow-hidden">
                                            <span className="text-xs tracking-normal leading-tight font-medium text-slate-700 dark:text-slate-200 whitespace-normal break-words">{agency.name}</span>
                                            {agency.agencyType && (
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider shrink-0 ${
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
