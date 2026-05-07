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
                className={`w-full h-11 bg-white/50 dark:bg-slate-800/50 border ${isOpen ? 'border-primary/50 ring-2 ring-primary/20 bg-white/70' : 'border-slate-200 dark:border-white/5'} rounded-2xl py-2 px-4 text-[10px] font-black uppercase tracking-tight flex items-center justify-between transition-all outline-none`}
            >
                <span className="truncate">{getDisplayText()}</span>
                <span className={`material-icons-round text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden min-w-[200px] animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-1.5 px-2 text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-primary/50"
                        />
                    </div>
                    <div className="p-1 max-h-60 overflow-y-auto">
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
                                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}
                                    >
                                        <div className={`size-4 rounded border flex flex-shrink-0 items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {isSelected && <span className="material-icons-round text-[10px]">check</span>}
                                        </div>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-[10px] font-black uppercase tracking-tight leading-none truncate">{agency.name}</span>
                                            {agency.agencyType && (
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
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
