import React, { memo } from 'react';
import type { Vehicle } from '../types';

interface VehicleTileProps {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
  onToggleCompare: (id: number) => void;
  isSelectedForCompare: boolean;
  onToggleWishlist: (id: number) => void;
  isInWishlist: boolean;
  isCompareDisabled: boolean;
  onViewSellerProfile: (sellerEmail: string) => void;
}

const VehicleTile: React.FC<VehicleTileProps> = ({ vehicle, onSelect, onToggleCompare, isSelectedForCompare, onToggleWishlist, isInWishlist, isCompareDisabled, onViewSellerProfile }) => {
  
  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompareDisabled) return;
    onToggleCompare(vehicle.id);
  }

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(vehicle.id);
  }

  const handleSellerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewSellerProfile(vehicle.sellerEmail);
  }

  return (
    <div 
      onClick={() => onSelect(vehicle)}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft overflow-hidden transform hover:-translate-y-1 hover:shadow-soft-lg transition-all duration-300 flex cursor-pointer group hover:ring-2 ring-brand-blue ring-offset-2 dark:ring-offset-brand-gray-dark"
    >
      <img className="w-32 sm:w-48 h-full object-cover flex-shrink-0" src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} />
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
            <h3 className="text-base sm:text-lg font-bold text-brand-gray-800 dark:text-brand-gray-100">{vehicle.make} {vehicle.model} {vehicle.variant || ''}</h3>
            <span className="text-sm font-semibold text-brand-gray-500 dark:text-brand-gray-400 bg-brand-gray-100 dark:bg-brand-gray-700 px-2 py-0.5 rounded flex-shrink-0 ml-2">{vehicle.year}</span>
        </div>
        
        <div className="mt-1 text-xs text-brand-gray-500 dark:text-brand-gray-500 truncate">
           By: <button onClick={handleSellerClick} className="font-semibold hover:underline focus:outline-none text-brand-blue dark:text-brand-blue-light">{vehicle.sellerName}</button>
        </div>
        
        <div className="mt-2 flex-grow grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-brand-gray-600 dark:text-brand-gray-400">
            <span>{`${vehicle.mileage.toLocaleString('en-IN')} kms`}</span>
            <span>{vehicle.fuelType}</span>
            <span>{vehicle.transmission}</span>
            <span>{vehicle.noOfOwners}{vehicle.noOfOwners === 1 ? 'st' : 'nd'} Owner</span>
            <span>{vehicle.rto}</span>
            <span>{`${vehicle.city}, ${vehicle.state}`}</span>
        </div>

        <div className="mt-auto pt-2 flex justify-between items-end">
             <p className="text-lg sm:text-xl font-extrabold text-brand-blue dark:text-brand-blue-light">₹{vehicle.price.toLocaleString('en-IN')}</p>
             <div className="flex items-center gap-2">
                <button
                  onClick={handleWishlistClick}
                  className="p-2 rounded-full hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700 transition-colors"
                  aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isInWishlist ? 'text-pink-500' : 'text-brand-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={handleCompareClick}
                  disabled={isCompareDisabled}
                  className={`p-2 rounded-full hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700 transition-colors ${isSelectedForCompare ? 'bg-brand-blue/20' : ''} ${isCompareDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={isSelectedForCompare ? "Remove from comparison" : "Add to comparison"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isSelectedForCompare ? 'text-brand-blue' : 'text-brand-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default memo(VehicleTile);