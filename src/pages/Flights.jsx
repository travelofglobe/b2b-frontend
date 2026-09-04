import React from 'react';
import FlightSearch from '../components/FlightSearch';

const Flights = () => {
    return (
        <div className="min-h-full flex flex-col bg-white dark:bg-[#202124] text-slate-800 dark:text-slate-100 font-sans pb-20">
            <main className="flex-1 flex flex-col bg-white dark:bg-[#202124]">
                
                {/* Hero Section */}
                <div className="w-full flex flex-col items-center">
                    {/* Image + title overlay container */}
                    <div className="w-full relative overflow-hidden pointer-events-none flex-shrink-0" style={{ maxHeight: '390px' }}>
                        {/* Light Theme Image */}
                        {/* Light Theme Image */}
                        <img 
                            src="https://www.gstatic.com/travel-frontend/animation/hero/flights_5.svg" 
                            alt="Google Flights banner illustration"
                            style={{
                                width: '100%',
                                maxWidth: '1200px',
                                height: 'auto',
                                margin: '0 auto'
                            }}
                            className="block dark:hidden"
                        />
                        {/* Dark Theme Image */}
                        <img 
                            src="https://www.gstatic.com/travel-frontend/animation/hero/flights_dark_theme_5.svg" 
                            alt="Google Flights banner illustration"
                            style={{
                                width: '100%',
                                maxWidth: '1200px',
                                height: 'auto',
                                margin: '0 auto'
                            }}
                            className="hidden dark:block"
                        />
                        {/* Title overlaid on bottom of image with transparent background */}
                        <div 
                            className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none"
                            style={{ paddingBottom: '0px' }}
                        >
                            <h1 
                                className="text-center text-transparent bg-clip-text bg-gradient-to-r from-[#1a73e8] to-[#8ab4f8] dark:from-[#8ab4f8] dark:to-[#e8f0fe]"
                                style={{ 
                                    fontFamily: '"Google Sans Display", Roboto, "Helvetica Neue", Arial, sans-serif',
                                    fontSize: '48px',
                                    fontWeight: 700,
                                    lineHeight: '64px',
                                    margin: 0
                                }}
                            >
                                Uçuşlar
                            </h1>
                        </div>
                    </div>

                    {/* Flight Search Component */}
                    <div className="w-full max-w-[1024px] px-4 md:px-6 mt-10 mb-16 pointer-events-auto">
                        <FlightSearch />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Flights;
