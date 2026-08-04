import React from 'react';

const HotelCardSkeleton = ({ viewMode = 'list' }) => {
    const isList = viewMode === 'list';

    return (
        <div className={`group bg-white dark:bg-[#111a22] rounded-xl border border-slate-200 dark:border-[#233648] shadow-xs flex animate-pulse ${isList ? 'flex-col md:flex-row' : 'flex-col'}`}>
            {/* Image Skeleton */}
            <div className={`relative overflow-hidden ${isList ? 'rounded-t-xl md:rounded-l-xl md:rounded-tr-none h-52 md:h-auto md:w-[330px] lg:w-[350px] shrink-0' : 'rounded-t-xl h-52'}`}>
                <div className="w-full h-full animate-shimmer" />
                
                {/* Badge Skeletons */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="w-24 h-6 rounded-xl animate-shimmer" />
                </div>
                
                {/* Favorite Button Skeleton */}
                <div className="absolute top-4 right-4 size-10 rounded-full animate-shimmer" />
            </div>

            {/* Content Skeleton */}
            <div className="p-4 sm:p-4.5 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 mr-3">
                            {/* Stars & Category */}
                            <div className="flex items-center gap-1 mb-1">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="size-2.5 rounded-full animate-shimmer" />
                                    ))}
                                </div>
                                <div className="w-12 h-2.5 rounded animate-shimmer ml-1" />
                            </div>

                            {/* Hotel Name */}
                            <div className={`h-6 rounded animate-shimmer mb-1 ${isList ? 'w-3/4' : 'w-full'}`} />

                            {/* Location */}
                            <div className="flex items-center gap-1 mt-1">
                                <div className="size-3 rounded animate-shimmer" />
                                <div className="h-3 w-1/2 rounded animate-shimmer" />
                            </div>
                        </div>

                        {/* Rating Badge Skeleton */}
                        <div className="w-10 h-9 rounded-lg animate-shimmer shrink-0" />
                    </div>

                    {/* Amenities Skeleton */}
                    <div className="flex flex-wrap gap-1.5 my-2.5">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="size-6.5 rounded-md animate-shimmer" />
                        ))}
                    </div>
                </div>

                <div className={`flex items-center justify-between pt-3 ${isList ? 'border-t border-slate-100 dark:border-[#233648]' : ''}`}>
                    <div className="flex flex-col gap-0.5">
                        {/* Price Skeleton */}
                        <div className="h-6 w-20 rounded animate-shimmer" />
                        {/* Tax Skeleton */}
                        <div className="h-2.5 w-14 rounded animate-shimmer" />
                    </div>

                    {/* Button Skeleton */}
                    <div className={`rounded-lg animate-shimmer ${isList ? 'h-9 w-24' : 'h-8 w-20'}`} />
                </div>
            </div>
        </div>
    );
};

export default HotelCardSkeleton;
