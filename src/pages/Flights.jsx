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
                        <img 
                            src="/hero-flights.svg" 
                            alt="Google Flights banner illustration"
                            style={{
                                display: 'block',
                                width: '100%',
                                maxWidth: '1200px',
                                height: 'auto',
                                opacity: 0.9,
                                margin: '0 auto'
                            }}
                            className="dark:opacity-40"
                        />
                        {/* Title overlaid on bottom of image with transparent background */}
                        <div 
                            className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none"
                            style={{ paddingBottom: '0px' }}
                        >
                            <h1 
                                className="text-[44px] md:text-[56px] text-[#202124] dark:text-white font-normal tracking-tight text-center"
                                style={{ 
                                    fontFamily: '"Google Sans", "Product Sans", Roboto, Arial, sans-serif', 
                                    lineHeight: '1.2',
                                    background: 'transparent',
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
