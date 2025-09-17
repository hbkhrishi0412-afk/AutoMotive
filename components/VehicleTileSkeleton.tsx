import React from 'react';

const VehicleTileSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft overflow-hidden flex">
      <div className="w-32 sm:w-48 h-full bg-brand-gray-200 dark:bg-brand-gray-700 animate-pulse flex-shrink-0"></div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <div className="h-5 sm:h-6 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-3/5 mb-2 animate-pulse"></div>
          <div className="h-5 sm:h-6 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/5 mb-2 animate-pulse"></div>
        </div>
        <div className="h-3 sm:h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 gap-2">
           <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
        </div>
        <div className="flex justify-between items-end mt-4">
           <div className="h-6 sm:h-7 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-2/5 animate-pulse"></div>
           <div className="flex gap-2">
                <div className="h-8 w-8 bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full animate-pulse"></div>
                <div className="h-8 w-8 bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full animate-pulse"></div>
           </div>
        </div>
      </div>
    </div>
);

export default VehicleTileSkeleton;