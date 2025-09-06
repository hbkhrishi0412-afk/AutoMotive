import React from 'react';
import type { Vehicle } from '../types';
import StarRating from './StarRating';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
  onToggleCompare: (id: number) => void;
  isSelectedForCompare: boolean;
  onToggleWishlist: (id: number) => void;
  isInWishlist: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onSelect, onToggleCompare, isSelectedForCompare, onToggleWishlist, isInWishlist }) => {
  
  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompare(vehicle.id);
  }

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(vehicle.id);
  }

  return (
    <div 
      className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
    >
      <div className="relative">
        <img className="w-full h-56 object-cover" src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.variant}`} onClick={() => onSelect(vehicle)} />
        {vehicle.isFeatured && (
          <div className="absolute top-0 left-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10">
            ⭐ Featured
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
            <button
              onClick={handleWishlistClick}
              className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isInWishlist ? 'text-pink-500' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </button>
            <label 
              onClick={handleCompareClick} 
              className="flex items-center bg-black bg-opacity-50 text-white text-xs font-bold px-3 py-2 rounded-full cursor-pointer hover:bg-opacity-75"
            >
              <input 
                type="checkbox" 
                checked={isSelectedForCompare}
                readOnly
                className="form-checkbox h-4 w-4 text-brand-blue-light bg-gray-700 border-gray-500 rounded focus:ring-brand-blue"
              />
              <span className="ml-2">Compare</span>
            </label>
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col cursor-pointer" onClick={() => onSelect(vehicle)}>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{vehicle.year} {vehicle.make} {vehicle.variant}</h3>
        <div className="flex items-center gap-2 mt-2">
            <StarRating rating={vehicle.averageRating || 0} readOnly size="sm"/>
            <span className="text-xs text-gray-500 dark:text-gray-400">({vehicle.ratingCount || 0} reviews)</span>
        </div>
        <p className="text-xl font-semibold text-brand-blue mt-2">${vehicle.price.toLocaleString()}</p>
        <p className="text-gray-600 dark:text-gray-300 mt-1">{vehicle.mileage.toLocaleString()} miles</p>
        <div className="mt-4 flex flex-wrap gap-2 flex-grow content-start">
          {vehicle.features.slice(0, 2).map((feature, index) => (
            <span key={index} className="bg-brand-gray-light dark:bg-brand-gray-dark text-brand-blue-dark dark:text-brand-blue-light text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;