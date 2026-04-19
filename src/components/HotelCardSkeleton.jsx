import React from 'react';

const HotelCardSkeleton = ({ viewMode = 'list' }) => {
    const isList = viewMode === 'list';

    return (
        <div className={`group bg-white dark:bg-[#111a22] rounded-2xl border border-slate-200 dark:border-[#233648] shadow-sm flex animate-pulse ${isList ? 'flex-col md:flex-row' : 'flex-col'}`}>
            {/* Image Skeleton */}
            <div className={`relative overflow-hidden ${isList ? 'rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none h-64 md:h-auto md:w-[400px] shrink-0' : 'rounded-t-2xl h-60'}`}>
                <div className="w-full h-full animate-shimmer" />
                
                {/* Badge Skeletons */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="w-24 h-6 rounded-xl animate-shimmer" />
                </div>
                
                {/* Favorite Button Skeleton */}
                <div className="absolute top-4 right-4 size-10 rounded-full animate-shimmer" />
            </div>

            {/* Content Skeleton */}
            <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 mr-4">
                            {/* Stars & Category */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="size-3 rounded-full animate-shimmer" />
                                    ))}
                                </div>
                                <div className="w-16 h-3 rounded animate-shimmer" />
                            </div>
                            
                            {/* Hotel Name */}
                            <div className={`h-8 rounded-lg animate-shimmer mb-3 ${isList ? 'w-3/4' : 'w-full'}`} />
                            
                            {/* Location */}
                            <div className="flex items-center gap-2">
                                <div className="size-4 rounded animate-shimmer" />
                                <div className="h-4 w-1/2 rounded animate-shimmer" />
                            </div>
                        </div>
                        
                        {/* Rating Badge Skeleton */}
                        <div className="w-12 h-12 rounded-xl animate-shimmer shrink-0" />
                    </div>

                    {/* Amenities Skeleton */}
                    <div className="flex flex-wrap gap-2 my-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="size-8 rounded-xl animate-shimmer" />
                        ))}
                    </div>
                </div>

                <div className={`flex items-center justify-between pt-4 ${isList ? 'border-t border-slate-100 dark:border-[#233648]' : ''}`}>
                    <div className="flex flex-col gap-1">
                        {/* Price Skeleton */}
                        <div className="h-8 w-24 rounded-lg animate-shimmer" />
                        {/* Tax Skeleton */}
                        <div className="h-3 w-16 rounded animate-shimmer" />
                    </div>
                    
                    {/* Button Skeleton */}
                    <div className={`rounded-xl animate-shimmer ${isList ? 'h-12 w-32' : 'h-10 w-24'}`} />
                </div>
            </div>
        </div>
    );
};

export default HotelCardSkeleton;
