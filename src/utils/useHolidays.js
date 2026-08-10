import { useState, useEffect } from 'react';
import { holidayService } from '../services/holidayService';

export const useHolidays = (countryCode) => {
    const [holidays, setHolidays] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadHolidays = async () => {
            if (!countryCode) {
                setHolidays([]);
                return;
            }
            
            // We'll load holidays for the current year and the next year to cover bookings easily
            const currentYear = new Date().getFullYear();
            setIsLoading(true);
            
            try {
                const [currentYearHolidays, nextYearHolidays] = await Promise.all([
                    holidayService.fetchHolidays(countryCode, currentYear),
                    holidayService.fetchHolidays(countryCode, currentYear + 1)
                ]);

                if (isMounted) {
                    setHolidays([...currentYearHolidays, ...nextYearHolidays]);
                }
            } catch (error) {
                console.error("Failed to load holidays in hook", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadHolidays();

        return () => {
            isMounted = false;
        };
    }, [countryCode]);

    return { holidays, isLoading };
};
