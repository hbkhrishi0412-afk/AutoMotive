import React, { memo } from 'react';
import type { Vehicle } from '../types';
import StarRating from './StarRating';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
  onToggleCompare: (id: number) => void;
  isSelectedForCompare: boolean;
  onToggleWishlist: (id: number) => void;
  isInWishlist: boolean;
  isCompareDisabled: boolean;
  onViewSellerProfile: (sellerEmail: string) => void;
}

const SpecIcon: React.FC<{ icon: React.ReactNode, text: string }> = ({ icon, text }) => (
    <div className="flex items-center gap-1.5 text-sm text-brand-gray-600 dark:text-brand-gray-400">
        {icon}
        <span>{text}</span>
    </div>
);

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onSelect, onToggleCompare, isSelectedForCompare, onToggleWishlist, isInWishlist, isCompareDisabled, onViewSellerProfile }) => {
  
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
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg overflow-hidden transform hover:-translate-y-1 hover:shadow-soft-xl transition-all duration-300 flex flex-col cursor-pointer group"
    >
      <div className="relative overflow-hidden">
        <img className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} />
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/50 to-transparent"></div>
        {vehicle.isFeatured && (
          <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Featured
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={handleWishlistClick}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isInWishlist ? 'text-pink-500' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </button>
        </div>
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-brand-gray-800 dark:text-brand-gray-100">{vehicle.make} {vehicle.model} {vehicle.variant || ''}</h3>
            <span className="text-lg font-semibold text-brand-gray-500 dark:text-brand-gray-400 bg-brand-gray-100 dark:bg-brand-gray-700 px-2 py-0.5 rounded">{vehicle.year}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
            <StarRating rating={vehicle.averageRating || 0} readOnly size="sm"/>
            <span className="text-xs text-brand-gray-500 dark:text-brand-gray-400">({vehicle.ratingCount || 0} reviews)</span>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs">
            {vehicle.sellerName && (
                <p className="text-brand-gray-500 dark:text-brand-gray-400 truncate">
                    Sold by: <button onClick={handleSellerClick} className="font-semibold hover:underline focus:outline-none text-brand-blue dark:text-brand-blue-light">{vehicle.sellerName}</button>
                </p>
            )}
            {vehicle.sellerAverageRating !== undefined && vehicle.sellerAverageRating > 0 && (
                <div className="flex items-center gap-1">
                    <StarRating rating={vehicle.sellerAverageRating} readOnly size="sm" />
                    <span className="text-brand-gray-500 dark:text-brand-gray-400">({vehicle.sellerRatingCount})</span>
                </div>
            )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-brand-gray-100 dark:border-brand-gray-700 grid grid-cols-3 gap-2 text-center">
            <SpecIcon icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} text={`${vehicle.mileage.toLocaleString('en-IN')} kms`} />
            <SpecIcon icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1014.12 11.88l-4.242 4.242z" /></svg>} text={vehicle.fuelType} />
            <SpecIcon icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>} text={vehicle.transmission} />
        </div>

        <div className="mt-auto pt-4 flex justify-between items-center">
             <p className="text-2xl font-extrabold text-brand-blue dark:text-brand-blue-light">₹{vehicle.price.toLocaleString('en-IN')}</p>
             <label 
              onClick={handleCompareClick} 
              title={isCompareDisabled ? "Comparison limit reached (max 4)" : "Add to compare"}
              className={`flex items-center bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-600 dark:text-brand-gray-300 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${isCompareDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-brand-gray-200 dark:hover:bg-brand-gray-600'}`}
            >
              <input 
                type="checkbox" 
                checked={isSelectedForCompare}
                readOnly
                disabled={isCompareDisabled}
                className="form-checkbox h-4 w-4 text-brand-blue bg-brand-gray-200 border-brand-gray-400 rounded focus:ring-brand-blue disabled:opacity-50"
              />
              <span className="ml-2">Compare</span>
            </label>
        </div>
      </div>
    </div>
  );
};

export default memo(VehicleCard);